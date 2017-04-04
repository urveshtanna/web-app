/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Initializes the Demo.
function Demo() {
  document.addEventListener('DOMContentLoaded', function() {
    // Shortcuts to DOM Elements.
    this.signInButton = document.getElementById('sign_in_button');
    this.progressBar = document.getElementById('progressBar');
    this.signOutButton = document.getElementById('sign_out_button');
    this.nameContainer = document.getElementById('name_container');
    this.fcmErrorContainer = document.getElementById('demo-fcm-error-container');
    this.usersContainer = document.getElementById('mdGridList');
    this.userProfileImage = document.getElementById('user_image');
    this.snackbar = document.getElementById('demo-snackbar');
    this.search = document.getElementById('search');
    this.headerTitle = document.getElementById('header-title');
    this.searchView = document.getElementById('search_view');
    //Initializing sections
    this.sectionProductList = document.getElementById('product-list-section');
    this.sectionOrders = document.getElementById('order-section');
    this.sectionProductDetails = document.getElementById('product_details');
    this.sectionAboutUs = document.getElementById('about-page');

    //initailizing navigators
    this.navigatorHome = document.getElementById('navigator-home');
    this.navigatorOrders = document.getElementById('navigator-orders');
    this.navigatorAboutUs = document.getElementById('navigator-about-us');

    this.navigatorAboutUs.addEventListener('click',function(){
      this.hideAllSections();
      this.headerTitle.innerText = 'About Us';
      this.searchView.style.display = 'none';
      this.sectionAboutUs.style.display = 'block';
    }.bind(this));

    this.navigatorOrders.addEventListener('click',function(){
      this.hideAllSections();
      this.headerTitle.innerText = 'My Orders';
      this.sectionOrders.style.display = 'block';
      this.searchView.style.display = 'none';
    }.bind(this));

    this.navigatorHome.addEventListener('click',function(){
      this.hideAllSections();
      this.headerTitle.innerText = 'Home';
      this.sectionProductList.style.display = 'block';
      this.searchView.style.display = 'block';
    }.bind(this));

    this.productList = [];
    this.showSnackbarView();

    // Bind events.
    this.sectionOrders.style.display = 'none';
    this.sectionProductDetails.style.display = 'none';
    this.signInButton.addEventListener('click', this.signIn.bind(this));
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    this.search.addEventListener('input',this.searchProducts.bind(this));
    firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
    firebase.messaging().onMessage(this.onMessage.bind(this));
    this.currentUid = null;

    //Show dialog once
    // var dialog = document.querySelector('dialog');
    //   var showModalButton = document.querySelector('.show-modal');
    //   if (! dialog.showModal) {
    //     dialogPolyfill.registerDialog(dialog);
    //   }
    //   dialog.showModal();
    //   dialog.querySelector('.close').addEventListener('click', function() {
    //     dialog.close();
    // });
  }.bind(this));
}

Demo.prototype.hideAllSections = function(){
  this.sectionProductDetails.style.display = 'none';
  this.sectionOrders.style.display = 'none';
  this.sectionAboutUs.style.display = 'none';
  this.sectionProductList.style.display = 'none';
};

// Triggered on Firebase auth state change.
Demo.prototype.onAuthStateChanged = function(user) {
  // If this is just an ID token refresh we exit.
  if (user && this.currentUid === user.uid) {
    return;
  }

  // Remove all Firebase realtime database listeners.
  if (this.listeners) {
    this.listeners.forEach(function(ref) {
      ref.off();
    });
  }
  this.listeners = [];
  // Adjust UI depending on user state.
  if (user) {
    this.nameContainer.innerText = user.displayName;
    this.userProfileImage.src = user.photoURL;
    this.signInButton.style.display = 'none';
    this.signOutButton.style.display = 'block';
    this.progressBar.style.display = 'block';
    //this.usersCard.style.display = 'block';
    //Show need to login page for something
    firebase.database().ref(`users/${user.uid}`).update({
      displayName: user.displayName,
      photoURL: user.photoURL
    });
    this.saveToken();
    this.currentUid = user.uid;
    this.updateCartCount();
    this.usersContainer.innerHTML = '';
    this.displayAllUsers();
  } else {
    this.signInButton.style.display = 'block';
    this.signOutButton.style.display = 'none';
    this.progressBar.style.display = 'none';
    this.nameContainer.innerText = 'Click down arrow to sign in';
    //this.usersCard.style.display = 'none';
    //Show need to login page for something
    this.usersContainer.innerHTML = '';
    this.displayAllUsers();
    this.currentUid = null;
    this.updateCartCount();//TODO
  }
};

// Display all users so that they can be followed.
Demo.prototype.displayAllUsers = function() {
  this.productList = [];
  this.progressBar.style.display = 'block';
  var usersRef = firebase.database().ref('product');
  usersRef.on('child_added', function(snapshot) {
    if(snapshot.val()){
      this.productList.push(snapshot.val());
      this.progressBar.style.display = 'none';
      this.addElementInList(snapshot.val());
    }
  }.bind(this));

  usersRef.on('child_changed', function(snapshot) {
      if(snapshot.val()){
        this.updateElementInList(snapshot.val());
      }
  }.bind(this));

  usersRef.on('child_removed', function(snapshot) {
    if(snapshot.val()){
        this.deleteElementInList(snapshot.val());
    }
  }.bind(this));


  //this.listeners.push(usersRef);
};

//Add listener to notify badge
Demo.prototype.updateCartCount = function(product) {
  var cartLayout = document.getElementById('cart_layout');
  var cartRef = firebase.database().ref('cart/' + this.currentUid);
  cartRef.on('value', function(snapshot) {
    cartLayout.setAttribute('data-badge', snapshot.numChildren());
  });
}

Demo.prototype.updateElementInList = function(snapshot){
  if(snapshot != null){
    let getDiv = document.getElementById(`div-at-position-${snapshot.product_id}`);
    let titleDiv = document.getElementById(`product-name-${snapshot.product_id}`);
    titleDiv.innerHTML = snapshot.product_name;
  }
};

Demo.prototype.deleteElementInList = function(product){
  if(product != null){
    let getDiv = document.getElementById(`div-at-position-${product.product_id}`);
    getDiv.innerHTML = '';
  }
};




//Adding element to list
Demo.prototype.addElementInList = function(product) {

  // Create the HTML for a user.
  let productName = product.product_name;
  let imgHref = product.img_link;
  let productId = product.product_id;
  let uid = product.key;
  let showProduct =
  '<div class="mdl-cell mdl-cell mdl-cell--2-col" id="div-at-position-' + productId + '">'+
    '<div class="demo-card-wide mdl-card mdl-shadow--2dp">'+
      '<div class="mdl-card__title" style="background: url('+imgHref+') no-repeat center;"></div>'+
        '<div class="mdl-card__supporting-text"><h2 class="mdl-card__title-text" id="product-name-'+productId+'">'+productName+'</h2></div>'+
        '<div class="mdl-card__actions">'+
          '<div class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect" style="float: right;" id="demo-follow-switch-' + productId + '">Add To cart</div>'+
        '</div>'+
        '<div class="mdl-card__menu" id="menu-product-'+productId+'">'+
          '<button class="mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect" style="margin-right: -8px;margin-top: -8px;">'+
            '<i class="material-icons mdl-color-text--grey-600">info_outline</i>'+
          '</button>'+
        '</div>'+
      '</div>'+
    '</div>';

  var div = document.createElement('div');
  div.innerHTML = showProduct;
  var userElement = div.firstChild;
  this.usersContainer.appendChild(userElement);
  let addToCartButton = document.getElementById('demo-follow-switch-' + productId);
  let productCard = document.getElementById('menu-product-' + productId);
  var user = firebase.auth().currentUser;
  if(user){
    var cartRef = firebase.database().ref('cart/' + user.uid + '/' + productId);
    var isAddedToCart = false;
    this.listeners.push(cartRef);
    cartRef.on('value', function(snapshot) {
        if(snapshot.val() == null){
          addToCartButton.innerHTML = 'Add To Cart';
          addToCartButton.style.color = "#2196F3";
          isAddedToCart = false;
        }else{
          addToCartButton.innerHTML = 'Remove';
          addToCartButton.style.color = "#F44336";
          isAddedToCart = true;
        }
      });
  }

  // Listen for switch state changes from the user.
  addToCartButton.addEventListener('click', function(){
    var user = firebase.auth().currentUser;
    if(user){
      if(isAddedToCart){
        cartRef.set(null);
      }else{
        cartRef.set(true);
      }
    }else{
      var handler = function(event) {
        var google = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(google);
      };
      var notification = document.querySelector('.mdl-js-snackbar');
      notification.MaterialSnackbar.showSnackbar({
        message: 'Please Login to add product in your cart',
        timeout: 2000,
        actionHandler: handler,
        actionText: 'Login'
      });
    }
  });

  productCard.addEventListener('click',function(){
    this.showProductDetails(product);
  }.bind(this));

}

Demo.prototype.showProductDetails = function(product) {
      var  index = -1;
      for(var i = 0, len = this.productList.length; i < len; i++) {
      if (this.productList[i].product_id === product.product_id) {
        index = i;
        break;
      }
    }
    var url = './product.html?index='+encodeURIComponent(index);
    document.location.href = url;
};

// Initiates the sign-in flow using LinkedIn sign in in a popup.
Demo.prototype.signIn = function() {
  var google = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(google);
};

// Initiates the search
Demo.prototype.searchProducts = function() {
    var query = document.getElementById("search").value.toLowerCase();
    var searchedList = [];
    this.usersContainer.innerHTML = '';

    for (var i = 0; i < this.productList.length ; i++) {
      var product = this.productList[i];
      if(product.product_name.toLowerCase().includes(query)){
        this.addElementInList(product);
      }
    }
};

// Signs-out of Firebase.
Demo.prototype.signOut = function() {
  firebase.auth().signOut();
};

// Deletes the user's account.
Demo.prototype.deleteAccount = function() {
  return firebase.database().ref('users/' + this.currentUid).remove().then(function() {
    return firebase.auth().currentUser.delete().then(function() {
      window.alert('Account deleted');
    }).catch(function(error) {
      if (error.code === 'auth/requires-recent-login') {
        window.alert('You need to have recently signed-in to delete your account. Please sign-in and try again.');
        firebase.auth().signOut();
      }
    });
  });
};

// Called when a notification is received while the app is in focus.
Demo.prototype.onMessage = function(payload) {
  console.log('Notifications received.', payload);

  // If we get a notification while focus on the app
  if (payload.notification) {
    let data = {
      message: payload.notification.body
    };
    this.snackbar.MaterialSnackbar.showSnackbar(data);
  }
};

// Saves the token to the database if available. If not request permissions.
Demo.prototype.saveToken = function() {
  firebase.messaging().getToken().then(function(currentToken) {
    if (currentToken) {
      firebase.database().ref('users/' + this.currentUid + '/notificationTokens/' + currentToken).set(true);
    } else {
      this.requestPermission();
    }
  }.bind(this)).catch(function(err) {
    console.error('Unable to get messaging token.', err);
    if (err.code === 'messaging/permission-default') {
      this.fcmErrorContainer.innerText = 'You have not enabled notifications on this browser. To enable notifications reload the page and allow notifications using the permission dialog.';
    } else if (err.code === 'messaging/notifications-blocked') {
      this.fcmErrorContainer.innerHTML = 'You have blocked notifications on this browser. To enable notifications follow these instructions: <a href="https://support.google.com/chrome/answer/114662?visit_id=1-636150657126357237-2267048771&rd=1&co=GENIE.Platform%3DAndroid&oco=1">Android Chrome Instructions</a><a href="https://support.google.com/chrome/answer/6148059">Desktop Chrome Instructions</a>';
    }
  }.bind(this));
};

// Requests permission to send notifications on this browser.
Demo.prototype.requestPermission = function() {
  console.log('Requesting permission...');
  firebase.messaging().requestPermission().then(function() {
    console.log('Notification permission granted.');
    this.saveToken();
  }.bind(this)).catch(function(err) {
    console.error('Unable to get permission to notify.', err);
  });
};

Demo.prototype.showSnackbarView = function() {


  var snackbarContainer = document.querySelector('#demo-snackbar-example');
  //var showSnackbarButton = document.querySelector('#view-source');
  var handler = function(event) {

  };

  // showSnackbarButton.addEventListener('click', function() {
  //   var notification = document.querySelector('.mdl-js-snackbar');
  //   notification.MaterialSnackbar.showSnackbar({
  //       message: 'It will be available soon!'
  //     });
  // });

}

// Load the demo.
window.demo = new Demo();
