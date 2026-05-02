'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { CaretLeft, CaretRight, X } from '@phosphor-icons/react'
import * as Dialog from '@radix-ui/react-dialog'
import type { GalleryImage } from '@/types'

interface GallerySectionProps {
  images: GalleryImage[]
}

export const GallerySection = ({ images }: GallerySectionProps): JSX.Element => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const open = (i: number): void => setLightboxIndex(i)
  const close = (): void => setLightboxIndex(null)

  const prev = useCallback((): void => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)
  }, [lightboxIndex, images.length])

  const next = useCallback((): void => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex + 1) % images.length)
  }, [lightboxIndex, images.length])

  return (
    <section className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32">
      <div className="mb-12">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-mono uppercase inline-block">
          STUDIO
        </h2>
        <div className="h-0.5 w-16 bg-accent mt-2" />
      </div>

      {images.length === 0 ? (
        <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">
          No gallery images yet.
        </p>
      ) : (
        <>
          {/* Mobile: horizontal snap slider */}
          <div className="flex md:hidden gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scroll-smooth">
            {images.map((img, i) => (
              <div
                key={i}
                className="snap-center flex-shrink-0 w-[85vw] relative rounded overflow-hidden cursor-pointer"
                style={{ aspectRatio: '4/3' }}
                onClick={() => open(i)}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="85vw"
                  loading={i === 0 ? undefined : 'lazy'}
                  priority={i === 0}
                />
              </div>
            ))}
          </div>

          {/* Desktop: masonry grid */}
          <div className="hidden md:block [column-count:1] sm:[column-count:2] lg:[column-count:3] gap-4">
            {images.map((img, i) => (
              <div
                key={i}
                className="break-inside-avoid mb-4 relative overflow-hidden rounded cursor-pointer group"
                style={{ aspectRatio: `${img.width}/${img.height}` }}
                onClick={() => open(i)}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading={i === 0 ? undefined : 'lazy'}
                  priority={i === 0}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Lightbox */}
      <Dialog.Root open={lightboxIndex !== null} onOpenChange={(open) => !open && close()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/90 z-50" />
          <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <Dialog.Title className="sr-only">Gallery Image</Dialog.Title>
            <AnimatePresence mode="wait">
              {lightboxIndex !== null && (
                <motion.div
                  key={lightboxIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
                  className="relative max-w-5xl w-full max-h-[90vh] rounded overflow-hidden"
                >
                  <Image
                    src={images[lightboxIndex].src}
                    alt={images[lightboxIndex].alt}
                    width={images[lightboxIndex].width}
                    height={images[lightboxIndex].height}
                    className="object-contain w-full max-h-[80vh]"
                  />

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-3 min-h-[44px] min-w-[44px] rounded bg-black/50 hover:bg-black/80 transition-colors text-white flex items-center justify-center"
                        aria-label="Previous"
                      >
                        <CaretLeft weight="bold" className="h-6 w-6" />
                      </button>
                      <button
                        onClick={next}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-3 min-h-[44px] min-w-[44px] rounded bg-black/50 hover:bg-black/80 transition-colors text-white flex items-center justify-center"
                        aria-label="Next"
                      >
                        <CaretRight weight="bold" className="h-6 w-6" />
                      </button>
                    </>
                  )}

                  <Dialog.Close asChild>
                    <button
                      className="absolute top-2 right-2 p-3 min-h-[44px] min-w-[44px] rounded bg-black/50 hover:bg-black/80 transition-colors text-white flex items-center justify-center"
                      aria-label="Close"
                    >
                      <X weight="bold" className="h-5 w-5" />
                    </button>
                  </Dialog.Close>
                </motion.div>
              )}
            </AnimatePresence>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  )
}
