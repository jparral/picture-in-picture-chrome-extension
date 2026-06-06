// Copyright 2025 Google LLC
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
    .filter((video) => video.readyState != 0)
    .sort((v1, v2) => {
      const v1Rect = v1.getBoundingClientRect();
      const v2Rect = v2.getBoundingClientRect();
      return v2Rect.width * v2Rect.height - v1Rect.width * v1Rect.height;
    });

  if (videos.length === 0) {
    return;
  }

  return videos[0];
}

// Request video to automatically enter picture-in-picture when eligible.
navigator.mediaSession.setActionHandler("enterpictureinpicture", () => {
  const video = findLargestPlayingVideo();
  if (video) {
    if (video.disablePictureInPicture) {
      video.disablePictureInPicture = false;
    }
    video.requestPictureInPicture();
  }
});
