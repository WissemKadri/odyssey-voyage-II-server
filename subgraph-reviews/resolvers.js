const { AuthenticationError, ForbiddenError } = require("./utils/errors");

const resolvers = {
  Mutation: {
    submitHostAndLocationReviews: async (
      _,
      { bookingId, hostReview, locationReview },
      { dataSources, userId },
    ) => {
      if (!userId) throw AuthenticationError();

      const listingId =
        await dataSources.bookingsDb.getListingIdForBooking(bookingId);
      const createdLocationReview =
        await dataSources.reviewsDb.createReviewForListing({
          bookingId,
          listingId,
          authorId: userId,
          text: locationReview.text,
          rating: locationReview.rating,
        });

      const { hostId } = await dataSources.listingsAPI.getListing(listingId);
      const createdHostReview = await dataSources.reviewsDb.createReviewForHost(
        {
          bookingId,
          hostId,
          authorId: userId,
          text: hostReview.text,
          rating: hostReview.rating,
        },
      );

      return {
        code: 200,
        success: true,
        message: "Successfully submitted review for host and location",
        hostReview: createdHostReview,
        locationReview: createdLocationReview,
      };
    },
    submitGuestReview: async (
      _,
      { bookingId, guestReview },
      { dataSources, userId },
    ) => {
      if (!userId) throw AuthenticationError();

      const { rating, text } = guestReview;
      const guestId =
        await dataSources.bookingsDb.getGuestIdForBooking(bookingId);

      const createdReview = await dataSources.reviewsDb.createReviewForGuest({
        bookingId,
        guestId,
        authorId: userId,
        text,
        rating,
      });
      return {
        code: 200,
        success: true,
        message: "Successfully submitted review for guest",
        guestReview: createdReview,
      };
    },
  },
  Host: {
    overallRating: ({ id }, _, { dataSources }) => {
      return dataSources.reviewsDb.getOverallRatingForHost(id);
    },
  },
  Review: {
    author: ({ authorId, targetType }) => {
      let role = "";
      if (targetType === "LISTING" || targetType === "HOST") {
        role = "Guest";
      } else {
        role = "Host";
      }
      return { __typename: role, id: authorId, role };
    },
    __resolveReference: ({ id }, { dataSources }) => {
      return dataSources.reviewsDb.getReview(id);
    },
  },
};

module.exports = resolvers;
