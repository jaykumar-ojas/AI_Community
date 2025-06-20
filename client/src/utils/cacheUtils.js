// utils/userCache.js
const CACHE_KEY = "user-cache";

export const getUserFromCache = (id) => {
  const cache = JSON.parse(sessionStorage.getItem(CACHE_KEY)) || {};
  return cache[id];
};

export const saveUserToCache = (id, data) => {
  const cache = JSON.parse(sessionStorage.getItem(CACHE_KEY)) || {};
  cache[id] = data;
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};
