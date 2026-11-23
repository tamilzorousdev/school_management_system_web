import { useEffect, useRef, useState } from 'react'
import { toApiError } from '@/lib/api/errors'
import { galleryApi } from './api'
import { checkFile, type UploadRules } from './labels'

export type UploadState = 'queued' | 'uploading' | 'accepted' | 'duplicate' | 'failed' | 'rejected'

export interface UploadTask {
  key: string
  file: File
  state: UploadState
  progress: number
  message: string | null
}

const CONCURRENCY = 3
let sequence = 0

export function useUploadQueue(albumId: number, onSettled: () => void) {
  const [tasks, setTasks] = useState<UploadTask[]>([])
  const queue = useRef<UploadTask[]>([])
  const active = useRef(0)
  const settled = useRef(onSettled)

  useEffect(() => {
    settled.current = onSettled
  })

  const patch = (key: string, next: Partial<UploadTask>) =>
    setTasks((list) => list.map((task) => (task.key === key ? { ...task, ...next } : task)))

  const run = async (task: UploadTask) => {
    patch(task.key, { state: 'uploading', progress: 0, message: null })
    try {
      const result = await galleryApi.upload(albumId, task.file, {
        onProgress: (fraction) => patch(task.key, { progress: Math.min(0.99, fraction) }),
      })
      const item = result.items[0]
      if (!item || item.status === 'failed') {
        patch(task.key, {
          state: 'failed',
          progress: 0,
          message: item?.message ?? 'Upload failed',
        })
      } else {
        patch(task.key, {
          state: item.status,
          progress: 1,
          message: item.status === 'duplicate' ? (item.message ?? 'Already in this album') : null,
        })
      }
    } catch (error) {
      patch(task.key, { state: 'failed', progress: 0, message: toApiError(error).message })
    }
  }

  const pump = () => {
    while (active.current < CONCURRENCY && queue.current.length) {
      const task = queue.current.shift() as UploadTask
      active.current += 1
      void run(task).finally(() => {
        active.current -= 1
        if (!active.current && !queue.current.length) settled.current()
        pump()
      })
    }
  }

  const add = (files: File[], rules: UploadRules) => {
    const created = files.map((file): UploadTask => {
      const problem = checkFile(file, rules)
      sequence += 1
      return {
        key: `${sequence}-${file.name}`,
        file,
        state: problem ? 'rejected' : 'queued',
        progress: 0,
        message: problem,
      }
    })
    setTasks((list) => [...created, ...list])
    queue.current.push(...created.filter((task) => task.state === 'queued'))
    pump()
    return created
  }

  const retry = (key: string) => {
    const task = tasks.find((item) => item.key === key)
    if (!task || task.state !== 'failed') return
    const next = { ...task, state: 'queued' as const, message: null, progress: 0 }
    patch(key, { state: 'queued', message: null, progress: 0 })
    queue.current.push(next)
    pump()
  }

  const retryFailed = () => {
    const failed = tasks.filter((task) => task.state === 'failed')
    failed.forEach((task) => patch(task.key, { state: 'queued', message: null, progress: 0 }))
    queue.current.push(...failed)
    pump()
  }

  const clearFinished = () =>
    setTasks((list) => list.filter((task) => task.state === 'queued' || task.state === 'uploading'))

  const busy = tasks.some((task) => task.state === 'queued' || task.state === 'uploading')

  return { tasks, add, retry, retryFailed, clearFinished, busy }
}
