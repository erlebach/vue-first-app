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

  // Remove duplicate entries in each entry of bookings_in and bookings_out

  u.print("computeFeeders::bookings_in", bookings_in);
  u.print("computeFeeders::bookings_out", bookings_out);

  return { bookings_in, bookings_out };
}
