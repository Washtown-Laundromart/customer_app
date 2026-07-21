export const demoNotifications = [
  {
    id: "bill-ready",
    type: "BILL_READY",
    title: "Your Washtownnig bill is ready",
    excerpt: "Washtownnig Surulere inspected your clothes and sent a wash + return delivery bill.",
    bodyHtml: "<p>Your clothes have been inspected by Washtownnig Surulere. Please review the breakdown and pay with Paystack so washing can begin.</p>",
    createdAt: "2026-06-20T09:24:00.000Z",
    paystackUrl: "https://paystack.com/pay/freshfold-demo",
    order: {
      code: "FF-20871",
      branch: { name: "Washtownnig Surulere" },
      bill: {
        cleaningSubtotal: 6400,
        deliveryFee: 2500,
        total: 8900,
        items: [
          { itemName: "Shirt", serviceType: "Wash & iron", quantity: 5, total: 2500 },
          { itemName: "Senator wear", serviceType: "Dry clean", quantity: 2, total: 2600 },
          { itemName: "Bedsheet", serviceType: "Wash & fold", quantity: 1, total: 1300 }
        ]
      }
    }
  },
  {
    id: "pickup-update",
    type: "ORDER_UPDATE",
    title: "Courier pickup confirmed",
    excerpt: "Your courier has been assigned and is heading to your pickup address.",
    bodyHtml: "<p>Your pickup courier has been assigned. You can track the order from your orders page.</p>",
    createdAt: "2026-06-20T08:42:00.000Z"
  },
  {
    id: "branch-broadcast",
    type: "BROADCAST",
    title: "Weekend express cleaning window",
    excerpt: "Surulere branch is accepting express cleaning requests until 3 PM today.",
    bodyHtml: "<p>Washtownnig Surulere is accepting express cleaning requests until <strong>3 PM</strong>. Requests after that time will roll into the next business day.</p>",
    createdAt: "2026-06-20T07:15:00.000Z"
  }
];
