var posts=["2026/04/13/这是一篇新博客/","2026/04/13/这是一篇新的博文/","2026/04/12/hello-world/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };