'use client'

import { motion } from 'framer-motion'
import { Star, StarHalf } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export interface Review {
  id?: string
  clientName: string
  rating: number
  text: string
  projectLink?: string
  service?: 'Mix' | 'Master' | 'Mix & Master' | 'Producing'
  date?: string
}

interface ReviewsSectionProps {
  reviews: Review[]
}

interface StarRatingProps {
  rating: number
}

const StarRating = ({ rating }: StarRatingProps): JSX.Element => {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<Star key={i} weight="fill" className="h-4 w-4 text-accent" />)
    } else if (rating >= i - 0.5) {
      stars.push(
        <StarHalf key={i} weight="fill" className="h-4 w-4 text-accent" />,
      )
    } else {
      stars.push(<Star key={i} weight="regular" className="h-4 w-4 text-muted-foreground" />)
    }
  }
  return <div className="flex gap-0.5">{stars}</div>
}

interface ReviewCardProps {
  review: Review
  index: number
}

const ReviewCard = ({ review, index }: ReviewCardProps): JSX.Element => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className="flex-shrink-0 w-[320px] md:w-auto bg-card border border-border rounded p-6 flex flex-col gap-4"
  >
    <StarRating rating={review.rating} />
    <p className="text-muted-foreground leading-relaxed text-sm flex-1">"{review.text}"</p>
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <span className="font-bold text-sm text-foreground">{review.clientName}</span>
      <div className="flex items-center gap-2">
        {review.service && (
          <span
            className={cn(
              'px-2 py-0.5 rounded font-mono text-xs border',
              'bg-accent/20 text-accent border-accent/30',
            )}
          >
            {review.service}
          </span>
        )}
        {review.projectLink && (
          <a
            href={review.projectLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Project
          </a>
        )}
      </div>
    </div>
  </motion.div>
)

export const ReviewsSection = ({ reviews }: ReviewsSectionProps): JSX.Element => (
  <section className="py-20 md:py-32 overflow-hidden">
    <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
      <div className="mb-12">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-mono uppercase inline-block">
          REVIEWS
        </h2>
        <div className="h-0.5 w-16 bg-accent mt-2" />
      </div>

      {reviews.length === 0 ? (
        <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">
          No reviews yet.
        </p>
      ) : (
        <>
          {/* Mobile: horizontal scroll */}
          <div className="flex md:hidden gap-4 overflow-x-auto pb-4 -mx-4 px-4">
            {reviews.map((review, i) => (
              <ReviewCard key={review.id ?? i} review={review} index={i} />
            ))}
          </div>
          {/* Desktop: grid */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <ReviewCard key={review.id ?? i} review={review} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  </section>
)
