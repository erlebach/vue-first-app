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

  bookings.forEach((r) => {
    r.id = r.id_f + "-" + r.id_nf;
  });

  const bookingsIdMap = u.createMapping(bookings, "id");

  // const bookings_out = u.createMappingOneToMany(bookings, "id_f");
  const bookingsIds_out = u.createMappingOneToManyAttr(
    bookings,
    "id_f",
    "id_nf"
  );

  // attribute: outgoing flight id
  // Given id_nf, generate all the incoming flights,
  // or equivalently, the bookings that connect all incoming flights to the outgoing flight id_f
  // The many elements must be unique
  // const bookings_in = u.createMappingOneToMany(bookings, "id_nf");
  const bookingsIds_in = u.createMappingOneToManyAttr(
    bookings,
    "id_nf",
    "id_f"
  );
  u.print("bookingsIds_in", bookingsIds_in);
  u.print("bookingsIds_out", bookingsIds_out);

  // Remove duplicate entries in each entry of bookings_in and bookings_out

  // u.print("computeFeeders::bookings_in", bookings_in);
  // u.print("computeFeeders::bookings_out", bookings_out);

  // Remove bookings_in, bookings_out once code works without them
  return {
    // bookings_in,
    // bookings_out,
    bookingsIdMap,
    bookingsIds_in,
    bookingsIds_out,
  };
}
