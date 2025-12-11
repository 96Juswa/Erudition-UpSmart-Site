import ReviewCard from './ReviewCard';

export default function LatestReviews({ reviews }) {
  return (
    <div className="mt-10">
      <h3 className="text-lg font-semibold text-[#094074] mb-3">
        Latest Reviews
      </h3>
      <div className="flex flex-col gap-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet.</p>
        ) : (
          reviews.slice(0, 3).map((review, index) => (
            <ReviewCard
              key={index}
              reviewer={review.reviewer}
              profileImage={review.profileImage}
              rating={review.rating}
              comment={review.comment}
              date={review.date}
            />
          ))
        )}
      </div>
    </div>
  );
}
