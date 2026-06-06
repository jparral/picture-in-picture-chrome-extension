// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function findAllVideos(root = document) {
  let videos = Array.from(root.querySelectorAll('video'));
  const elements = root.querySelectorAll('*');
  for (const element of elements) {
    if (element.shadowRoot) {
      videos = videos.concat(findAllVideos(element.shadowRoot));
    }
  }
  return videos;
}

function findLargestPlayingVideo() {
  const videos = findAllVideos()
    .filter(video => video.readyState != 0)
    .filter(video => {
      const rect = video.getBoundingClientRect();
      return rect.width >= 100 && rect.height >= 100;
    })
    .sort((v1, v2) => {
      // Prioritize playing videos.
      const v1Playing = !v1.paused && !v1.ended;
      const v2Playing = !v2.paused && !v2.ended;
      if (v1Playing !== v2Playing) {
        return v2Playing ? 1 : -1;
      }
      const v1Rect = v1.getBoundingClientRect();
      const v2Rect = v2.getBoundingClientRect();
      return ((v2Rect.width * v2Rect.height) - (v1Rect.width * v1Rect.height));
    });

  if (videos.length === 0) {
    return;
  }

  return videos[0];
}

async function requestPictureInPicture(video) {
  try {
    await video.requestPictureInPicture();
    video.setAttribute('__pip__', true);
    video.addEventListener('leavepictureinpicture', event => {
      video.removeAttribute('__pip__');
    }, { once: true });
    new ResizeObserver(maybeUpdatePictureInPictureVideo).observe(video);
  } catch (error) {
    console.error('Failed to enter Picture-in-Picture mode:', error);
  }
}

function maybeUpdatePictureInPictureVideo(entries, observer) {
  const observedVideo = entries[0].target;
  if (!document.querySelector('[__pip__]')) {
    observer.unobserve(observedVideo);
    return;
  }
  const video = findLargestPlayingVideo();
  if (video && !video.hasAttribute('__pip__')) {
    observer.unobserve(observedVideo);
    requestPictureInPicture(video);
  }
}

(async () => {
  const video = findLargestPlayingVideo();
  if (!video) {
    return;
  }
  if (video.hasAttribute('__pip__')) {
    document.exitPictureInPicture();
    return;
  }
  if (video.disablePictureInPicture) {
    video.disablePictureInPicture = false;
  }
  await requestPictureInPicture(video);
})();
