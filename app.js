const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Environment variabes
const id = process.env.USER_ID;
const pw = process.env.PASSWORD;
const cluster = process.env.CLUSTER_NAME;
const url ="mongodb+srv://" + id + ":" + pw + "@" + cluster + ".mongodb.net/todolistDB"; 

mongoose.connect(url);

const itemsSchema = {
  name: String,
};
new mongoose.Schema(itemsSchema);
const Item = mongoose.model("Item", itemsSchema);

//Default items present in list for initialisation
const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + icon to add a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

//Schema for array containing all documents of todolistDB
const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

//get request to homepage
app.get("/", function (req, res) {
  Item.find({}, function (err, tasks) {
    if (err) {
      console.log(err);
    } else {
      // const day = date.getDate();

      if (tasks.length === 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Inserted default items in todolistDB");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: tasks });
      }
    }
  });
});

//Adding new task
app.post("/", function (req, res) {
  const item = req.body.newItem;
  const listName = req.body.list;

  const i = new Item({
    name: item,
  });

  if (listName === "Today") { //Root route
    i.save();
    res.redirect("/");
  } else { //Custom list route
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(i);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//Deleting a task
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") { //Root route
    Item.findByIdAndDelete(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted checked item");
        res.redirect("/");
      }
    });
  } else { //Custom list route
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId }}}, function (err, foundList){
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

//Custom lists using express routing parameters
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        console.log("Not found");
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show the exisitng list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
