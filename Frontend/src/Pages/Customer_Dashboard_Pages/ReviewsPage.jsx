import React, { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';

const ReviewsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);

  const [vendors, setVendors] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const loadReviews = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await fetch('http://localhost:5000/api/customer/reviews', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || 'Failed to fetch reviews');

    setMyReviews(data.myReviews || []);
    setAllReviews(data.allReviews || []);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const [vendorsResponse] = await Promise.all([
          fetch('http://localhost:5000/api/customer/vendors', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          loadReviews()
        ]);

        if (vendorsResponse.ok) {
          const vendorData = await vendorsResponse.json();
          setVendors(vendorData);
        }
      } catch (error) {
        console.error('Error loading reviews page:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const openModal = (review = null) => {
    if (review) {
      setEditingReviewId(review._id);
      setSelectedVendorId(review.vendorId);
      setRating(review.rating);
      setReviewText(review.text);
    } else {
      setEditingReviewId(null);
      setSelectedVendorId('');
      setRating(0);
      setReviewText('');
    }
    setHoverRating(0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingReviewId(null);
    setSelectedVendorId('');
    setRating(0);
    setHoverRating(0);
    setReviewText('');
  };

  const submitReview = async () => {
    if (!selectedVendorId) return alert('Please choose a vendor.');
    if (!rating) return alert('Please select a rating.');
    if (!reviewText.trim()) return alert('Please write a review.');

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/customer/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vendorId: selectedVendorId,
          rating,
          text: reviewText.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Failed to save review');

      await loadReviews();
      closeModal();
    } catch (error) {
      alert(error.message || 'Failed to save review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const confirmed = window.confirm('Delete this review?');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/customer/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Failed to delete review');
      await loadReviews();
    } catch (error) {
      alert(error.message || 'Failed to delete review');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 font-bold">Loading reviews...</div>;
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
          <p className="text-gray-500 mt-1">Share your experience with vendors</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#EA580C] hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Star size={18} className="fill-white" />
          Write Review
        </button>
      </div>

      <div className="mb-10">
        {myReviews.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-sm text-gray-500">
            You have not written any reviews yet.
          </div>
        ) : (
          <div className="space-y-4">
            {myReviews.map((review) => (
              <div key={review._id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-2 gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{review.vendorName}</h3>
                    <div className="flex items-center gap-2 mt-1 mb-3">
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={16} className={star <= review.rating ? 'fill-current' : 'text-gray-200 fill-gray-200'} />
                        ))}
                      </div>
                      <span className="text-gray-400 text-xs">{formatDate(review.createdAt)}</span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => openModal(review)}
                      className="px-4 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      className="px-4 py-1.5 border border-red-100 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-6">All Reviews</h2>
        <p className="text-gray-500 text-sm mb-4 -mt-4">See what others are saying</p>

        {allReviews.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-sm text-gray-500">
            No reviews yet.
          </div>
        ) : (
          <div className="space-y-4">
            {allReviews.map((review) => (
              <ReviewCard
                key={review._id}
                name={review.customerName}
                vendor={review.vendorName}
                date={formatDate(review.createdAt)}
                rating={review.rating}
                text={review.text}
              />
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{editingReviewId ? 'Edit Review' : 'Write a Review'}</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Select Vendor</label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  disabled={Boolean(editingReviewId)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all cursor-pointer disabled:opacity-60"
                >
                  <option value="">Choose a vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.businessName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="transition-transform hover:scale-110 focus:outline-none"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <Star
                        size={32}
                        className={`transition-colors ${star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 fill-gray-100'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Your Review</label>
                <textarea
                  rows="4"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all resize-none"
                />
              </div>

              <button
                onClick={submitReview}
                disabled={isSubmitting}
                className="w-full bg-[#EA580C] hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-orange-100 disabled:opacity-60"
              >
                {isSubmitting ? 'Saving...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ReviewCard = ({ name, vendor, date, rating, text }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex gap-4">
    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 bg-orange-100 text-orange-600">
      {(name || '?').charAt(0).toUpperCase()}
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-start mb-1">
        <div>
          <h4 className="font-bold text-gray-900 text-sm">{name}</h4>
          <p className="text-gray-400 text-xs">{vendor}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex text-yellow-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={14} className={star <= rating ? 'fill-current' : 'text-gray-200 fill-gray-200'} />
            ))}
          </div>
          <span className="text-gray-400 text-xs">{date}</span>
        </div>
      </div>
      <p className="text-gray-600 text-sm mt-2">{text}</p>
    </div>
  </div>
);

export default ReviewsPage;

