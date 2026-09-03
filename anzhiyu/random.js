var posts=["2026/04/12/waline添加CloudFlare_ImgBed/","2026/08/12/blog-maintenance-ci-comments/","2026/08/09/writing-tutorial-methodology/","2026/08/09/waline-series/02-worker-proxy/","2026/08/09/waline-series/01-imgbed-upload/","2026/08/09/waline-series/00-series-index/","2026/08/09/music-player-series/03-controls-layout/","2026/08/09/music-player-series/02-lyrics/","2026/08/09/music-player-series/01-pjax-zero-interrupt/","2026/08/09/music-player-series/00-series-index/","2026/08/09/hexo-anzhiyu-series/10-deploy-verify/","2026/08/09/hexo-anzhiyu-series/09-quality-ci/","2026/08/09/hexo-anzhiyu-series/08-api-key-security/","2026/08/09/hexo-anzhiyu-series/07-toc-style/","2026/07/31/hexo-anzhiyu-series/04-theme-upgrade-patch/","2026/07/31/friend-circle-series/06-troubleshooting/","2026/07/31/friend-circle-series/05-lost-contact-stat/","2026/07/31/friend-circle-series/04-auto-detect-deploy/","2026/07/31/friend-circle-series/03-backend/","2026/07/31/friend-circle-series/02-fcircle-page/","2026/07/31/friend-circle-series/01-link-page/","2026/07/31/friend-circle-series/00-series-index/","2026/07/30/hexo-anzhiyu-series/05-link-footer-misc/","2026/07/30/hexo-anzhiyu-series/06-deployment-cicd/","2026/07/30/hexo-anzhiyu-config-guide/","2026/07/30/hexo-anzhiyu-series/03-album-system/","2026/07/30/hexo-anzhiyu-series/02-statistics-ai-abstract/","2026/07/30/hexo-anzhiyu-series/01-environment-structure/","2026/07/30/hexo-anzhiyu-series/00-series-index/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };var friend_link_list=[{"name":"清羽飞扬","link":"https://blog.liushen.fun/","avatar":"https://blog.liushen.fun/info/avatar.ico","descr":"柳影曳曳，清酒孤灯，扬笔撒墨，心境如霜","recommend":true},{"name":"安知鱼","link":"https://blog.anheyu.com/","avatar":"https://npm.elemecdn.com/anzhiyu-blog-static@1.0.4/img/avatar.jpg","descr":"生活明朗，万物可爱","recommend":true},{"name":"张洪Heo","link":"https://blog.zhheo.com/","avatar":"https://blog.zhheo.com/img/favicon4.0.webp","descr":"分享设计与科技生活","recommend":true},{"name":"山岳库博","link":"https://kmar.top/","avatar":"https://cdn.jsdelivr.net/npm/@kmar/fonts/avatar/own.png","descr":"开发学习启发性二刺螈","recommend":true},{"name":"老刘博客","link":"https://www.liublog.cn/","avatar":"https://npm.elemecdn.com/anzhiyu-blog-static@1.0.4/img/avatar.jpg","descr":"课件制作和网络生活"},{"name":"Guoqi Sun","link":"https://blog.guoqi.dev","avatar":"https://img.weiguang.eu.org/file/ivKJERUQ.webp","descr":"尝试，失败，重试。这就是成长的节奏。"},{"name":"Black Flies","link":"https://www.yyyzyyyz.cn/","avatar":"https://npm.elemecdn.com/imgscdn/img/202111191951780.JPG","descr":"When nothing goes right,just go left."},{"name":"Leonus","link":"https://blog.leonus.cn/","avatar":"https://q1.qlogo.cn/g?b=qq&nk=990320751&s=5","descr":"进一寸有进一寸的欢喜"},{"name":"风记星辰","link":"https://www.thyuu.com/","avatar":"https://std.thyuu.com/logo.webp","descr":"热爱你来过的每度温暖"},{"name":"洛屿","link":"https://www.drluo.top/","avatar":"https://img02.anheyu.com/adminuploads/1/2022/12/11/63956a6e94510.webp","descr":"记录生活，分享见闻"},{"name":"道宣的窝","link":"https://daoxuan.cc/","avatar":"https://img02.anheyu.com/adminuploads/1/2023/02/13/63ea2dc47351a.webp","descr":"记录生活，分享技术"},{"name":"小林の木屋","link":"https://www.wjlin0.com","avatar":"https://www.wjlin0.com/upload/6c84294d-b842-4ba8-9963-5446cceb1dd0.png","descr":"一个黑客小子！"},{"name":"前尘小筑","link":"https://mnchen.cn/","avatar":"https://image.mnchen.cn/2023/12/mnochen.jpg","descr":"虽多尘色染，犹见墨痕浓"},{"name":"Ariasakaの小窝","link":"https://blog.yaria.top","avatar":"https://img.0v0.my/2024/12/05/67517bcf104da.png","descr":"人有悲欢离合 月有阴晴圆缺","siteshot":"https://img.0v0.my/2024/09/19/66ec130ad1de0.png","theme_color":"#ed709b"},{"name":"杜老师说","link":"https://dusays.com","avatar":"https://cdn.dusays.com/favicon.ico","descr":"分享知识与网络生活"},{"name":"codeqihan的博客","link":"https://www.codeqihan.com","avatar":"https://weavatar.com/avatar/b06bf450773d97a959efd792198fec89b1f683b5a8bea046f487ecccba37affa?sha256=1&d=mp&s=120","descr":"记录学习与成长"},{"name":"Fomalhaut🥝","link":"https://www.fomal.cc/","avatar":"https://www.fomal.cc/assets/avatar.webp","descr":"Future is now 🍭🍭🍭","siteshot":"https://source.fomal.cc/siteshot/www.fomal.cc.webp"},{"name":"枋柚梓","link":"https://inkss.cn","avatar":"https://inkss.cn/img/avatar.png","descr":"繁星永存，记忆亘古不变。"},{"name":"故事的程序猿","link":"https://blog.lichenghao.cn","avatar":"https://blog.lichenghao.cn/avatar.svg","descr":"好好学习，天天向上↑"},{"name":"未知之旅","link":"https://blog.xenosp.cn/","avatar":"https://cravatar.cn/avatar/4EA126708E5063621186D6B5895D2684","descr":"在未知中成长，超越自我","siteshot":"https://image.xenosp.cn/i/2026/01/08/1-1695537794.webp"},{"name":"浅笑安然","link":"https://siax.cn","avatar":"https://img02.anheyu.com/adminuploads/1/2023/05/04/64536ebfee596.png","descr":"浅笑安然，静待花开"},{"name":"胡桃木实验室","link":"https://www.htmacg.cn/","avatar":"https://img02.anheyu.com/adminuploads/1/2023/06/05/647db064b074f.png","descr":"分享技术与生活"},{"name":"Akilar","link":"https://akilar.top/","avatar":"https://img02.anheyu.com/adminuploads/1/2022/09/02/6311fc9de6507.webp","descr":"生活明朗，期待您的光临","recommend":true}];
    var refreshNum = 1;
    function friendChainRandomTransmission() {
      const randomIndex = Math.floor(Math.random() * friend_link_list.length);
      const { name, link } = friend_link_list.splice(randomIndex, 1)[0];
      Snackbar.show({
        text:
          "点击前往按钮进入随机一个友链，不保证跳转网站的安全性和可用性。本次随机到的是本站友链：「" + name + "」",
        duration: 8000,
        pos: "top-center",
        actionText: "前往",
        onActionClick: function (element) {
          element.style.opacity = 0;
          window.open(link, "_blank");
        },
      });
    }
    function addFriendLinksInFooter() {
      var footerRandomFriendsBtn = document.getElementById("footer-random-friends-btn");
      if(!footerRandomFriendsBtn) return;
      footerRandomFriendsBtn.style.opacity = "0.2";
      footerRandomFriendsBtn.style.transitionDuration = "0.3s";
      footerRandomFriendsBtn.style.transform = "rotate(" + 360 * refreshNum++ + "deg)";
      const finalLinkList = [];
  
      let count = 0;

      while (friend_link_list.length && count < 3) {
        const randomIndex = Math.floor(Math.random() * friend_link_list.length);
        const { name, link, avatar } = friend_link_list.splice(randomIndex, 1)[0];
  
        finalLinkList.push({
          name,
          link,
          avatar,
        });
        count++;
      }
  
      let html = finalLinkList
        .map(({ name, link }) => {
          const returnInfo = "<a class='footer-item' href='" + link + "' target='_blank' rel='noopener nofollow'>" + name + "</a>"
          return returnInfo;
        })
        .join("");
  
      html += "<a class='footer-item' href='/link/'>更多</a>";

      document.getElementById("friend-links-in-footer").innerHTML = html;

      setTimeout(()=>{
        footerRandomFriendsBtn.style.opacity = "1";
      }, 300)
    };