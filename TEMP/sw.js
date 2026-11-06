(function (self) {
    'use strict';

    if (self.location.protocol !== 'http:' && self.location.protocol !== 'https:') return;

    var VERSION = 'lxh-yeji-v1';
    var APP_ROOT = new URL('../', self.location.href).toString();
    var CORE = [
        'index.html',
        'TEMP/css/game.css',
        'TEMP/manifest.webmanifest',
        'TEMP/data/lore.js',
        'TEMP/js/art.js',
        'TEMP/js/world.js',
        'TEMP/js/entities.js',
        'TEMP/js/abilities.js',
        'TEMP/js/vfx.js',
        'TEMP/js/audio.js',
        'TEMP/js/story.js',
        'TEMP/js/ui.js',
        'TEMP/js/game.js'
    ];

    function scoped(path) {
        return new URL(path, APP_ROOT).toString();
    }

    function cacheResponse(request, response) {
        if (!response || !response.ok || response.type !== 'basic') return response;
        var copy = response.clone();
        self.caches.open(VERSION).then(function (cache) {
            return cache.put(request, copy);
        }).catch(function () { return null; });
        return response;
    }

    self.addEventListener('install', function (event) {
        event.waitUntil(
            self.caches.open(VERSION).then(function (cache) {
                return Promise.all(CORE.map(function (path) {
                    var request = new Request(scoped(path), { cache: 'reload' });
                    return self.fetch(request).then(function (response) {
                        if (!response.ok) return null;
                        return cache.put(request, response);
                    }).catch(function () { return null; });
                }));
            }).then(function () { return self.skipWaiting(); })
        );
    });

    self.addEventListener('activate', function (event) {
        event.waitUntil(
            self.caches.keys().then(function (keys) {
                return Promise.all(keys.filter(function (key) {
                    return key.indexOf('lxh-yeji-') === 0 && key !== VERSION;
                }).map(function (key) { return self.caches.delete(key); }));
            }).then(function () { return self.clients.claim(); })
        );
    });

    self.addEventListener('fetch', function (event) {
        var request = event.request;
        if (request.method !== 'GET' || request.headers.has('range')) return;
        var url;
        try { url = new URL(request.url); } catch (error) { return; }
        if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.origin !== self.location.origin) return;

        if (request.mode === 'navigate') {
            event.respondWith(
                self.fetch(request).then(function (response) {
                    return cacheResponse(request, response);
                }).catch(function () {
                    return self.caches.match(request).then(function (cached) {
                        return cached || self.caches.match(scoped('index.html'));
                    });
                })
            );
            return;
        }

        event.respondWith(
            self.caches.match(request).then(function (cached) {
                if (cached) return cached;
                return self.fetch(request).then(function (response) {
                    return cacheResponse(request, response);
                });
            })
        );
    });
})(self);
