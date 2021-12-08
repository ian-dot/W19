const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/index.js",
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
]; //these are the files (the paths) that we want to cache (make sure paths work)

const CACHE_NAME = "static-cache-v2";//the name of the cache 
const DATA_CACHE_NAME = "data-cache-v1";//this is api data cache (this is from the browser)

// install 
//self is refering to window (like this but self is always refering to window unlike this that sometimes refers to calling object)
self.addEventListener("install", function(evt) {//was the service worker installed (regestering the files into the cache)
  evt.waitUntil(//wait untill install
    caches.open(CACHE_NAME).then(cache => {//opening the cache (opening a thread)
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(FILES_TO_CACHE);//actually caching (adding the files)
    })
  );//now we have another thread

  self.skipWaiting();//skip the waiting step
});
//need this to remove the old cache data
self.addEventListener("activate", function(evt) {
  evt.waitUntil(//wait until activation
    caches.keys().then(keyList => {//go through all of the keys inside of caches
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {//not in our cache
            console.log("Removing old cache data", key);
            return caches.delete(key);//delete all of the old stuff
          }
        })
      );
    })
  );

  self.clients.claim();
});

// fetch
self.addEventListener("fetch", function(evt) {//intercepts all reqeuests with api in url
  // cache successful requests to the API
  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {//opening the cache and asking the request that was sent
        return fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());//get that data and storing the info in the cache 
            }

            return response;
          })
          .catch(err => {//thinks no internet 
            // Network request failed, try to get it from the cache.
            return cache.match(evt.request);//this is for when no internet and is asking for the info from the cache
          });
      }).catch(err => console.log(err))
    );

    return;
  }

  evt.respondWith(
    fetch(evt.request).catch(function() {
      return caches.match(evt.request).then(function(response) {
        if (response) {
          return response;
        } else if (evt.request.headers.get("accept").includes("text/html")) {
          // return the cached home page for all requests for html pages
          return caches.match("/");
        }
      });
    })
  );
});