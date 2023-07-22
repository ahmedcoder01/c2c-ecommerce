# Business Requirements for C2C E-commerce Application

## Introduction

This document outlines the business requirements for a Customer-to-Customer (C2C) E-commerce Application. The aim of this application is to facilitate buying and selling between consumers (for educational purposes only).

## Features and Functionalities

### User Registration and Authentication
- Users should be able to create an account using an email address and password.
- Users should be able to log in and log out of their account.
- User credentials should be stored securely.

### Product Listing
- Sellers should be able to create product listings.
- Each product listing should include product details, price, quantity, and images.
- Products has dynamic variants (e.g., size, color, etc.)
- Sellers should be able to update and delete their product listings.

### Product Search and Filtering
- Buyers should be able to search for products by name, category, and price.
- Buyers should be able to filter products by category, price, and rating.
- Buyers should be able to sort products by price and rating.

### Shopping Cart
- Buyers should be able to add products to a shopping cart.
- Buyers should be able to view their shopping cart with all added items.
- Buyers should be able to update the quantity or remove items from their shopping cart.

### Order Placement and Payment Processing
- Buyers should be able to place an order from their shopping cart.
- Buyers should be able to select their shipping address for each order.
- Buyers should be able to pay for their orders using their preferred payment method.

### Order Fulfillment
- Sellers should be notified when an order is placed.
- Sellers should be able to update the status of the order (e.g., processing, shipped, delivered).

### Reviews and Ratings
- Buyers should be able to leave reviews and ratings for products.

## Non-functional Requirements

- The application should be responsive and provide a smooth user experience.
- The application should be secure and protect user data.
- The application should be reliable, with minimal downtime.

## Constraints

- The project will be hosted on GitHub and should follow best practices for source control.
- The project will be built using Prisma as the database ORM.

## Future Enhancements

- Implementation of a recommendation engine for product suggestions.
- Adding more payment gateways for user convenience.
