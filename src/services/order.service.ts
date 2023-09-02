// /* eslint-disable no-await-in-loop */

//! can a seller buy from himself?

// import prisma from '../../prisma/prisma-client';
// import { getCartDetails } from './cart.service';

// // STEPS:
// // 1. Create a new order
// // 2. add each cart item to the order as a new order item and decrement the stock
// // 3. delete the cart
// // 4. create stripe checkout session

// export const createOrder = async ({ cartId, userId }: { cartId: number; userId: number }) => {
//   const cart = await getCartDetails(cartId);

//   const order = await prisma.$transaction(async tx => {
//     await tx.order.create({
//       data: {
//         orderItems: {
//           create: [
//             ...cart.cartItems.map(cartItem => ({
//               productVariant: {
//                 connect: {
//                   id: cartItem.productVariant.id,
//                 },
//               },
//               quantity: cartItem.quantity,
//               price: cartItem.productVariant.price,
//             })),
//           ],
//         },
//         shippingAddress: {
//           connect: {
//             id: NULL,
//           },
//         },
//         user: {
//           connect: {
//             id: userId,
//           },
//         },

//         status: 'PENDING',
//       },
//     });

//     // decrement stock
//     for (const cartItem of cart.cartItems) {
//       await tx.productVariant.update({
//         where: {
//           id: cartItem.productVariant.id,
//         },
//         data: {
//           quantity: {
//             decrement: cartItem.quantity,
//           },
//         },
//       });
//     }
//   });
// };
