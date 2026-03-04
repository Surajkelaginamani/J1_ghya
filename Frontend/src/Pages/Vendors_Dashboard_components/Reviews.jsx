import React, { useEffect, useState } from 'react';
import { ArrowLeft, Star, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Reviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    const fetchVendorReviews = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/vendor/reviews', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || 'Failed to load reviews');

        setReviews(data.reviews || []);
        setAverageRating(Number(data.averageRating || 0));
        setTotalReviews(Number(data.totalReviews || 0));
      } catch (error) {
        console.error('Error loading vendor reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorReviews();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/Ven_Dashboard')} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reputation Manager</h1>
              <p className="text-gray-500 text-sm">Your customer feedback from database</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
            <h3 className="text-4xl font-bold text-gray-900">{totalReviews > 0 ? averageRating.toFixed(1) : 'New'}</h3>
            <div className="flex justify-center my-2 gap-1 text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  fill={i < Math.round(averageRating) ? 'currentColor' : 'none'}
                  size={20}
                  className={i < Math.round(averageRating) ? '' : 'text-gray-300'}
                />
              ))}
            </div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Average Rating</p>
            <p className="text-gray-500 text-xs mt-1">{totalReviews} review{totalReviews === 1 ? '' : 's'}</p>
          </div>

          <div className="col-span-2 bg-orange-50 p-6 rounded-2xl border border-orange-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-orange-900 mb-1">Impact on Sales</h3>
              <p className="text-sm text-orange-700/80">
                {totalReviews > 0 ? 'Customer reviews are now synced from DB.' : 'No reviews yet. Ask customers to review your service.'}
              </p>
            </div>
            <div className="bg-white/50 p-3 rounded-full text-orange-600">
              <ThumbsUp size={24} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Feedback</h2>
          </div>

          {isLoading ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-gray-500 text-sm">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-gray-500 text-sm">No customer reviews yet.</div>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-700 font-bold">
                      {review.student.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{review.student}</h3>
                      <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 mb-3 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < review.rating ? 'currentColor' : 'none'}
                      className={i < review.rating ? '' : 'text-gray-300'}
                    />
                  ))}
                </div>

                <p className="text-gray-700 text-sm leading-relaxed">
                  "{review.text}"
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Reviews;
