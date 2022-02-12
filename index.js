const express = require("express");
const paypal = require("paypal-rest-sdk");
const fs = require("fs");
const exphdbs = require("express-handlebars");
var path = require("path");
const app = express();

app.set("views", path.join(__dirname, "views"));
app.engine("handlebars", exphdbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "AWusrdzwFhBUm01_PhGQpDy4gFvFu72DGWfMqx77TyYFz9OYRUKpsjRoC7ohKcRFpyfZRcPDLGKYSbXk",
  client_secret:
    "EHYv6qIUnCYKGvgq6ShWoJgQlMZT_ZfkSodA1CUX4HXXJwV748U0C-q8RerNHfrzrYV5lzquKtN9NMUq",
});

// file chứa items
var items = JSON.parse(fs.readFileSync("items.json"));

// tổng giá tiền
var total = 0;
for (i = 0; i < items.length; i++) {
  total += parseFloat(items[i].price) * items[i].quantity;
}

app.get("/", function (req, res) {
  res.render("index");
});

// check main.handlebars để hiểu
app.post("/pay", function (req, res) {
  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    },
    transactions: [
      {
        item_list: {
          items: items,
        },
        amount: {
          currency: "USD",
          total: total.toString(),
        },
        description: "Hat for the best team ever",
      },
    ],
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      res.render("cancle");
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === "approval_url") {
          res.redirect(payment.links[i].href);
        }
      }
    }
  });
});

app.get("/cancle", function (req, res) {
  res.render("cancle");
});

app.get("/success", (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: total.toString(),
        },
      },
    ],
  };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        res.render("cancle");
      } else {
        // console.log(JSON.stringify(payment));

        res.render("success");
      }
    }
  );
});

app.get("/cancel", (req, res) => res.send("Cancelled"));

app.listen(3000, function () {
  console.log(total);
});
