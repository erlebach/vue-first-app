// import { map } from "core-js/core/array";
import * as u from "./utils.js";

export function computeFeeders(bookings) {
  // Run through bookings, and for each ID, collect the feeders and the outbounds
  // u.print("enter computeFeeders");

  // const fsu_m = u.createMapping(fsu, "id"); // orig code

  // attribute: incoming flight id
  // Given id_f, generate all the outgoing flights,
  // or equivalently, the bookings that connect outgoing flights to the feeder id_f.
  // bookings_out[id_f]: list of id_f's outgoing flights
  // bookings_in[id_nf]: list of id_nf's feeders
  // Each list should not have id duplicates

  const bookings_out = u.createMappingOneToMany(bookings, "id_f");

  // attribute: outgoing flight id
  // Given id_nf, generate all the incoming flights,
  // or equivalently, the bookings that connect all incoming flights to the outgoing flight id_f
  // The many elements must be unique
  const bookings_in = u.createMappingOneToMany(bookings, "id_nf");

  u.print("computeFeeders::bookings_in", bookings_in);
  u.print("computeFeeders::bookings_out", bookings_out);

  // u.print("bookings_out", bookings_out);
  // u.print("bookings_in", bookings_in);

  // const feeders = Object.create(null);

  // bookings.forEach((b) => {
  //   feeders[b.id_nf] = [];
  // });
  // bookings.forEach((b) => {
  //   feeders[b.id_nf].push(b.id_f);
  //   if (b.TAIL_f === b.TAIL_nf) {
  //     // I would like the first feeder to have the same tail as the outgoing flight
  //     // interchange first and last element of feeders[b.id_nf]
  //     //   console.log("Swap first and last array elements");
  //     u.swap(feeders[b.id_nf]);
  //   }
  // });

  // // What is the difference between feeders and bookings_in?
  // // There is no difference.

  // u.print(
  //   "feeders[2021-12-05CUNPTY21:260327]",
  //   feeders["2021-12-05CUNPTY21:260327"]
  // );
  // u.print(
  //   "bookings_in[2021-12-05CUNPTY21:260327]",
  //   bookings_in["2021-12-05CUNPTY21:260327"]
  // );

  // console.log("INSIDE computeFeeders");
  // u.print("bookings", bookings);
  // u.print("bookings_in", bookings_in);
  // u.print("bookings_out", bookings_out);
  // u.print("feeders", feeders); // what are feeders

  return { bookings_in, bookings_out };
}
