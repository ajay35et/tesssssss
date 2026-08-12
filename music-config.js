/*
  MUSIC CONFIG
  -------------
  Yahan apni YouTube playlist IDs add karo.

  Example:
  {
    id: "PLxxxxxxxxxxxxxxxx",
    name: "Desi Highway",
    subtitle: "Hindi / Road Trip"
  }

  Playlist ID YouTube playlist URL ke ?list= ke baad wala part hota hai.
*/
window.MUSIC_CONFIG = {
  playlists: [
    {
      id: "PLxxxxxxxxxxxxxxxx",
      name: "Desi Highway",
      subtitle: "Apni YouTube playlist ID yahan lagao"
    },
    {
      id: "PLyyyyyyyyyyyyyyyy",
      name: "Rickshaw Nights",
      subtitle: "Second playlist"
    }
  ],

  // Background images ke relative paths.
  // Apni JPG/PNG/WebP files assets/backgrounds/ me rakho.
  backgrounds: [
    "images/bg-01.svg",
    "images/bg-02.svg",
    "images/bg-03.svg",
    "images/bg-04.svg"
  ],

  // Screen par dikhne wali random lines.
  taglines: [
    "किस्मत तेजी दस्ती है, घर में मधुरा काशी है।",
    "रास्ता अपना है, सफ़र अपना है।",
    "हॉर्न बजा, शहर जगा।",
    "दिल में गाना, सड़क पे कहानी।",
    "जहाँ सड़क खत्म, वहाँ सफ़र शुरू।"
  ],

  // true = playlist ke songs random order me.
  shuffle: true,

  // true = song khatam hone par next song.
  autoplayNext: true
};
