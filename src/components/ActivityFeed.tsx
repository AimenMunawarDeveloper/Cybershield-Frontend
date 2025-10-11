"use client";

import { Check, Bell, Trash2, ShoppingCart } from "lucide-react";

const orders = [
  {
    id: 1,
    icon: Bell,
    iconColor: "text-[var(--neon-blue)]",
    title: "$2400, Design changes",
    date: "22 DEC 7:20 PM",
  },
  {
    id: 2,
    icon: Trash2,
    iconColor: "text-[var(--crimson-red)]",
    title: "New order #4219423",
    date: "21 DEC 11:21 PM",
  },
  {
    id: 3,
    icon: ShoppingCart,
    iconColor: "text-[var(--neon-blue)]",
    title: "Server Payments for April",
    date: "20 DEC 2:15 PM",
  },
  {
    id: 4,
    icon: Bell,
    iconColor: "text-[var(--neon-blue)]",
    title: "Website maintenance update",
    date: "19 DEC 9:45 AM",
  },
  {
    id: 5,
    icon: ShoppingCart,
    iconColor: "text-[var(--neon-blue)]",
    title: "New subscription plan",
    date: "18 DEC 4:30 PM",
  },
];

export default function ActivityFeed() {
  return (
    <div className="dashboard-card rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">
          Orders overview
        </h3>
        <div className="flex items-center text-sm">
          <Check className="w-4 h-4 text-[var(--success-green)] mr-1" />
          <span className="text-[var(--success-green)]">+30%</span>
          <span className="text-[var(--medium-grey)] ml-1">this month</span>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {orders.map((order) => {
          const IconComponent = order.icon;
          return (
            <div key={order.id} className="flex items-start space-x-3 py-2">
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                <IconComponent className={`w-5 h-5 ${order.iconColor}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {order.title}
                </p>
                <p className="text-[var(--medium-grey)] text-xs mt-1">
                  {order.date}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
