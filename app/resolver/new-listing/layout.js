// app/new-listing/layout.js
"use client";

import { ListingFormProvider } from "@/app/context/ListingFormContext";

export default function NewListingLayout({ children }) {
  return <ListingFormProvider>{children}</ListingFormProvider>;
}
