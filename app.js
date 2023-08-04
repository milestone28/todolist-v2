const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const mongoDB = "mongodb+srv://gary-admin:kidrock1432@cluster0.kbfnazv.mongodb.net/todoListDB";
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const itemCollection = mongoose.model("Item", itemsSchema);
const listCollection = mongoose.model("List", listSchema);

const defaultItems = [
  {
    name: "Welcome to your todolist!",
  },
  {
    name: "Hit the + button to add a new item",
  },
  {
    name: "<-- Hit this to delete an item",
  },
];

const option = { ordered: true };

mongoose
  .connect(mongoDB)
  .then(() => {
    console.log("mongoDB is connected");
  })
  .catch((err) => {
    console.log(`Cant connect to database server : ${err}`);
  });

app.get("/", function (req, res) {
  itemCollection.find().then((itemsList) => {
    if (itemsList.length === 0) {
      //insert
      itemCollection
        .insertMany(defaultItems, option)
        .then(() => {
          console.log("Default Item added successfully");
        })
        .catch((err) => {
          console.log(`Error Default adding the items : ${err}`);
        });8
      itemsList = defaultItems;
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: itemsList,
      });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listItem = req.body.list;
  const item = new itemCollection({
    name: itemName,
  });

  if (listItem === "Today") {
    item.save()
      .then(() => {
        console.log("successfully saved!!");
      })
      .catch((err) => {
        console.log(err);
      });
    res.redirect("/");
  } else {
    listCollection
    .findOne({ name: listItem })
    .then((foundList) => {
       foundList.items.push(item);
       foundList.save()
       .then(() => {
         console.log("successfully saved!!");
         res.redirect("/"+listItem);
       })
       .catch((err) => {
         console.log(err);
       });
    })
    .catch((err) => {
      console.log(err);
    });
  }
});


app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
 
    if(listName === "Today"){
        //In the default list
      del().catch(err => console.log(err));
      async function del(){
        await itemCollection.deleteOne({_id: checkedItemId});
        res.redirect("/");
      }
    } else{
         //In the custom list
      update().catch(err => console.log(err));
      async function update(){
        await listCollection.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
        res.redirect("/" + listName);
      }
    }
});

app.get("/:customListName", (req, res) => {
  //dynamic Route
  const reqParam = _.capitalize(req.params.customListName);

  listCollection
    .findOne({ name: reqParam })
    .then((foundList) => {
      if (foundList) {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      } else {
        const list = new listCollection({
          name: reqParam,
          items: defaultItems,
        });

        list.save();
        res.redirect("/" + reqParam);
      }
    })
    .catch((err) => {
      console.log(err);
    });

});


app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function(){ //this will listed local or online like heroku
  console.log("Server is Up!");
})
