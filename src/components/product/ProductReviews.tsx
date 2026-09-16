import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/services/api/reviewService';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Fetch reviews for this product
  const { data, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewService.getProductReviews(productId),
    enabled: !!productId,
    staleTime: 1000 * 60 * 3,
  });

  const reviews = data?.reviews || [];
  const stats = data?.stats;

  // Mutation to add review
  const addReviewMutation = useMutation({
    mutationFn: () => reviewService.addReview(productId, rating, reviewText.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['products', 'detail', productId] });
      Alert.alert('Review Submitted!', 'Thank you for reviewing this product.');
      setReviewText('');
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      Alert.alert('Submission Failed', err?.message || 'Could not submit review.');
    },
  });

  const handleSubmitReview = () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to leave a review.');
      return;
    }
    if (rating < 1 || rating > 5) {
      Alert.alert('Invalid Rating', 'Please select a star rating from 1 to 5.');
      return;
    }
    addReviewMutation.mutate();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Customer Reviews</Text>
          {stats?.totalReviews ? (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {stats.averageRating.toFixed(1)} ★ based on {stats.totalReviews}{' '}
              {stats.totalReviews === 1 ? 'review' : 'reviews'}
            </Text>
          ) : (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              No reviews yet. Be the first to review!
            </Text>
          )}
        </View>

        {isAuthenticated && !isFormOpen && (
          <Button
            title="Write Review"
            variant="outline"
            onPress={() => setIsFormOpen(true)}
            style={styles.writeBtn}
          />
        )}
      </View>

      {/* Review Submission Form */}
      {isFormOpen && (
        <View style={[styles.formCard, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Rate this product</Text>

          {/* Star selector */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)} hitSlop={6}>
                <Text style={[styles.starIcon, { color: star <= rating ? '#F59E0B' : '#CBD5E1' }]}>
                  ★
                </Text>
              </Pressable>
            ))}
            <Text style={[styles.ratingLabel, { color: theme.text }]}>{rating} of 5 stars</Text>
          </View>

          <Input
            placeholder="Write your honest review..."
            multiline
            numberOfLines={3}
            value={reviewText}
            onChangeText={setReviewText}
            style={styles.reviewInput}
          />

          <View style={styles.formActions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setIsFormOpen(false)}
              style={styles.formBtn}
            />
            <Button
              title="Submit"
              onPress={handleSubmitReview}
              loading={addReviewMutation.isPending}
              style={styles.formBtn}
            />
          </View>
        </View>
      )}

      {/* Review Cards List */}
      {isLoading ? (
        <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: 16 }} />
      ) : (
        reviews.map((rev) => (
          <View
            key={rev._id}
            style={[styles.reviewCard, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.reviewCardHeader}>
              <Text style={[styles.reviewerName, { color: theme.text }]}>{rev.userName}</Text>
              <Text style={styles.cardStars}>{'★'.repeat(rev.rating)}</Text>
            </View>
            {rev.reviewText ? (
              <Text style={[styles.cardText, { color: theme.textSecondary }]}>
                {rev.reviewText}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.five,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  writeBtn: {
    width: 120,
    height: 38,
  },
  formCard: {
    padding: Spacing.four,
    borderRadius: 14,
    marginBottom: Spacing.four,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.three,
  },
  starIcon: {
    fontSize: 28,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  reviewInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  formBtn: {
    flex: 1,
    height: 42,
  },
  reviewCard: {
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.two,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardStars: {
    color: '#F59E0B',
    fontSize: 14,
  },
  cardText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
