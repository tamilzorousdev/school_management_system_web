import { Link } from '@tanstack/react-router'
import { CalendarDays, Image as ImageIcon, Images, Lock, Star, Video } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import type { Album } from '../api'
import { ALBUM_STATUS, formatStorage, scopeLabel } from '../labels'

export function AlbumCard({ album }: { album: Album }) {
  const status = ALBUM_STATUS[album.status]
  return (
    <Link
      to='/gallery/albums/$albumId'
      params={{ albumId: String(album.id) }}
      search={{ page: 1 }}
      className='group flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-shadow outline-none hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/40'
    >
      <div className='relative aspect-[4/3] w-full overflow-hidden bg-muted'>
        {album.cover_url ? (
          <img
            src={album.cover_url}
            alt=''
            loading='lazy'
            className='size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]'
          />
        ) : (
          <div className='grid size-full place-items-center text-muted-foreground'>
            <Images className='size-10' aria-hidden />
          </div>
        )}
        <div className='absolute top-2 left-2 flex flex-wrap gap-1'>
          <Badge tone={status.tone} className='bg-card/90 backdrop-blur'>
            {status.label}
          </Badge>
          {album.is_featured && (
            <Badge tone='warning' className='bg-card/90 backdrop-blur'>
              <Star className='size-3' aria-hidden />
              Featured
            </Badge>
          )}
          {album.on_hold && (
            <Badge tone='info' className='bg-card/90 backdrop-blur'>
              <Lock className='size-3' aria-hidden />
              On hold
            </Badge>
          )}
        </div>
      </div>
      <div className='grid min-w-0 gap-1.5 p-3'>
        <span className='truncate font-bold' title={album.title}>
          {album.title}
        </span>
        <span className='truncate text-xs text-muted-foreground'>
          {scopeLabel(album)}
          {album.category ? ` · ${album.category}` : ''}
        </span>
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
          <span className='tabular inline-flex items-center gap-1'>
            <ImageIcon className='size-3.5' aria-hidden />
            {album.photo_count}
            <span className='sr-only'>photos</span>
          </span>
          <span className='tabular inline-flex items-center gap-1'>
            <Video className='size-3.5' aria-hidden />
            {album.video_count}
            <span className='sr-only'>videos</span>
          </span>
          <span className='tabular'>{formatStorage(album.size_bytes)}</span>
          {album.event_date && (
            <span className='inline-flex items-center gap-1'>
              <CalendarDays className='size-3.5' aria-hidden />
              {formatDate(album.event_date)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
