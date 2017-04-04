'use strict';

// Initializes the Product.
function Product() {
  document.addEventListener('DOMContentLoaded', function() {
  	this.productDetails = document.getElementById('product_details');
    this.progressBar = document.getElementById('progressBar');
    this.mainContent = document.getElementById('main_content');
    this.btnNext = document.getElementById('btn-next');
    this.btnPrevious = document.getElementById('btn-previous');

    firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));

    this.mainContent.style.display = 'none';
	var passedValues = {};
	var query = window.location.search.substring(1).split("&");
	for (var i = 0, max = query.length; i < max; i++){
	    if (query[i] === "") // check for trailing & with no param
	        continue;

	    var param = query[i].split("=");
	    passedValues[decodeURIComponent(param[0])] = decodeURIComponent(param[1] || "");
	}
	this.showProductDetails(passedValues.index);
	this.btnNext.addEventListener('click',function(){
		var index = parseInt(passedValues.index) + 1;
		var url = './product.html?index='+encodeURIComponent(index);
    	document.location.href = url;
	}.bind(this));

	this.btnPrevious.addEventListener('click',function(){
		var index = parseInt(passedValues.index) - 1;
		var url = './product.html?index='+encodeURIComponent(index);
    	document.location.href = url;
	}.bind(this));
	
  }.bind(this));
}

//Add listener to notify badge
Product.prototype.updateCartCount = function(product) {
  var cartLayout = document.getElementById('cart_layout');
  var cartRef = firebase.database().ref('cart/' + firebase.auth().currentUser.uid);
  cartRef.on('value', function(snapshot) {
    cartLayout.setAttribute('data-badge', snapshot.numChildren());
  });
}

// Triggered on Firebase auth state change.
Product.prototype.onAuthStateChanged = function(user) {
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
    //this.usersCard.style.display = 'block';
    //Show need to login page for something
    firebase.database().ref(`users/${user.uid}`).update({
      displayName: user.displayName,
      photoURL: user.photoURL
    });
    this.currentUid = user.uid;
    this.updateCartCount();
  } else {
    this.currentUid = null;
    this.updateCartCount();//TODO
  }
};

Product.prototype.showProductDetails = function(index){
		var ref = firebase.database().ref(`product`);
		var secondRef= firebase.database().ref(`product/${index}/`);
		secondRef.on("value", function(snapshot) {
  			if(snapshot.val()){
  				var details = '<div style="margin-top:16px; margin-left:16px; margin-right:16px; margin-bottom:24px;">'+
  								'<div>'+
  									'<div class="mdl-card__title" style="float:left;" style="width:148px; height:148px;">'+
  										'<img src="'+snapshot.val().img_link+'" style="width:148px; height:148px;"></img>'+
  									'</div>'+
              						'<div style="margin-left: 24px;">'+
              							'<h3 style="color:grey;">'+snapshot.val().product_name+'</h3>'+
              							'<div style="color:grey; font-weight: 300;">'+snapshot.val().average_size+'</div>'+
              							'<button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent" style="color:white; margin-top:16px;" id="add-to-cart">Add to cart</button>'+
              						'</div>'+
              					'</div>'+
              					'<div class="mdl-color-text--grey-700" style="margin-top: 100px">'+
              							'<div style="font-weight:500; font-size: 24px;">Discription</div>'+
              							'<div style="font-weight:300; font-size: 16px; margin-top: 12px;">'+snapshot.val().description+'</div>'+
              							'<div style="font-weight:500; font-size: 24px; margin-top:48px">Packaging Information</div>'+
              							'<div style="font-weight:300; font-size: 16px; margin-top: 12px;">'+snapshot.val().packing_info+'</div>'+
              							'<div style="font-weight:500; font-size: 24px; margin-top:48px">Storage Information</div>'+
              							'<div style="font-weight:300; font-size: 16px; margin-top: 12px;">'+snapshot.val().storage_info+'</div>'+
              					'</div>'+
              				'</div>';

              	var div = document.createElement('div');
  				div.innerHTML = details;
  				var userElement = div.firstChild;
  				this.productDetails.appendChild(userElement);
  				this.progressBar.style.display = 'none';
  				this.mainContent.style.display = 'block';

  				let addToCartButton = document.getElementById('add-to-cart');
  				var user = firebase.auth().currentUser;
			  	if(user){
			    	var cartRef = firebase.database().ref('cart/' + user.uid + '/' + snapshot.val().product_id);
			    	console.log('cart/' + user.uid + '/' + snapshot.val().product_id);
			    	var isAddedToCart = false;
			    	this.listeners.push(cartRef);
			    	cartRef.on('value', function(snapshot) {
			        	if(snapshot.val() == null){
			          		addToCartButton.innerHTML = 'Add To Cart';
			          		isAddedToCart = false;
			        	}else{
			          		addToCartButton.innerHTML = 'Remove';
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
  			}else{
  				this.mainContent.style.display = 'none';
  				this.progressBar.style.display = 'none';
			    var notification = document.querySelector('.mdl-js-snackbar');
			    notification.MaterialSnackbar.showSnackbar({
			        message: 'Sorry no product found!',
			        timeout: 2000,
			    });
  			}
		}.bind(this));

};

// Load the demo.
window.product = new Product();