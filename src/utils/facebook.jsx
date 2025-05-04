// src/utils/facebook.js
export const initFacebookSDK = (appId) => {
    return new Promise((resolve, reject) => {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: appId,
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v17.0' // Use the latest version
        });
        resolve();
      };
  
      // Load the SDK asynchronously
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    });
  };