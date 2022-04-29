AFRAME.registerComponent("markerhandler", {
  init: async function () {

    if(tableNumber === null)
    {
      this.askTableNumber();
    }

    //get the dishes collection from firestore database
    var dishes = await this.getDishes();

    //markerFound event
    this.el.addEventListener("markerFound", () => {
      if(tableNumber !== null)
      {
        var markerId = this.el.id;      
        this.handleMarkerFound(dishes, markerId);
      }
    });

    //markerLost event
    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });

  },

  askTableNumber: function()
  {
    var icon_url = "https://raw.githubusercontent.com/whitehatjr/menu-card-app/main/hunger.png"

    swal({
      title: "Welcome to ABC",
      icon: icon_url,
      content: {element: "input", attributes: {placeholder: "Type your table number", type: "number", min: 1}},
      closeOnClickOutside: false,
    }).then(inputValue => {
      tableNumber = inputValue
    })
  },

  handleMarkerFound: function (dishes, markerId) {
    
    var todaysDate = new Date();
    var todaysDay = todaysDate.getDay();
    var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    var dish = dishes.filter(dish => dish.id === markerId)[0];
    var model = document.querySelector(`#model-${dish.id}`);
    model.setAttribute("visible", true);

    var ingredientsContainer = document.querySelector(`#main-plane-${dish.id}`);
    ingredientsContainer.setAttribute("visible", true);

    var pricePlane = document.querySelector(`#price-plane-${dish.id}`);
    pricePlane.setAttribute("visible", true);

    if(dish.unavailable_days.includes(days[todaysDay]))
    {
      swal({
        icon: "warning",
        title: dish.dish_name.toUpperCase(),
        text: "This dish is not available today.",
        timer: 2500,
        buttons: false
      })
    }
    else
    {
      var model = document.querySelector(`#model-${dish.id}`);
      model.setAttribute("position", dish.model_geometry.position)
      model.setAttribute("rotation", dish.model_geometry.rotation)
      model.setAttribute("scale", dish.model_geometry.scale)
    

      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";

      var ratingButton = document.getElementById("rating-button");
      var orderButtton = document.getElementById("order-button");

      if(tableNumber !== null)
      {
        ratingButton.addEventListener("click", function () {
          swal({
            icon: "warning",
            title: "Rate Dish",
            text: "Work In Progress"
          });
        });

        orderButtton.addEventListener("click", () => {
          var tableNo
          tableNumber <= 9 ? (tableNo = `T0${tableNumber}`) : (`T${tableNumber}`);
          this.handleOrder(tableNo, dish)
          swal({
            icon: "https://i.imgur.com/4NZ6uLY.jpg",
            title: "Thanks For Order !",
            text: "Your order will be served soon on your table!",
            timer: 2000,
            buttons: false
          });
        });
    }
  }
  },

  handleOrder: function(tableNo, dish)
  {
    firebase.firestore().collection("Tables").doc(tableNo).get()
    .then(doc => {
      var details = doc.data();
      if(details["current_orders"][dish.id])
      {
        details["current_orders"][dish.id]["quantity"] += 1
        var currentQuantity = details["current_orders"][dish.id]["quantity"];
        details["current_orders"][dish.id]["subtotal"] = currentQuantity*dish.price
      } 
      else
      {
        details["current_orders"][dish.id] = {item: dish.dish_name, price: dish.price, quantity: 1, subtotal: dish.price*1};
      }

      details.total_bill += dish.price

      firebase.firestore().collection("Tables").doc(doc.id).update(details);
    })
  },

  handleMarkerLost: function () {
    // Changing button div visibility
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  },
  //get the dishes collection from firestore database
  getDishes: async function () {
    return await firebase
      .firestore()
      .collection("Dishes")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  }
});

// ./ngrok.exe http 8887