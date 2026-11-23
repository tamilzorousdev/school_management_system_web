import { useState, useEffect } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  RotateCcw,
  Save,
  Sliders,
  Trash2,
} from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import {
  kraConfigsApi,
  useKraConfigs,
  type BulkUpdateKraItem,
  type KraConfig,
} from '../api'

export function KraConfigurationModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const query = useKraConfigs()
  const [items, setItems] = useState<KraConfig[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // New KRA form state
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newWeight, setNewWeight] = useState(15)
  const [newCategory, setNewCategory] = useState<
    'academics' | 'pedagogy' | 'administrative' | 'extracurricular' | 'general'
  >('pedagogy')
  const [isSubmittingNew, setIsSubmittingNew] = useState(false)

  useEffect(() => {
    if (query.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(query.data)
    }
  }, [query.data])

  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weightage_percent) || 0), 0)
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01

  const handleWeightChange = (id: number, val: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, weightage_percent: val } : it))
    )
  }

  const handleTitleChange = (id: number, val: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, title: val } : it))
    )
  }

  const handleDescriptionChange = (id: number, val: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, description: val } : it))
    )
  }

  const handleDeleteKra = async (id: number) => {
    try {
      await kraConfigsApi.delete(id)
      setItems((prev) => prev.filter((it) => it.id !== id))
      alerts.success('KRA deactivated')
      void query.refetch()
    } catch (err: unknown) {
      alerts.error(err instanceof Error ? err.message : 'Failed to delete KRA')
    }
  }

  const handleResetDefaults = async () => {
    try {
      setIsResetting(true)
      const res = await kraConfigsApi.resetDefaults()
      setItems(res)
      alerts.success('KRAs reset to standard school template')
      void query.refetch()
    } catch (err: unknown) {
      alerts.error(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setIsResetting(false)
    }
  }

  const handleSaveAll = async () => {
    if (!isWeightValid) {
      alerts.error(`Total weight must equal 100%. Currently it is ${totalWeight.toFixed(1)}%.`)
      return
    }

    try {
      setIsSaving(true)
      const payload: BulkUpdateKraItem[] = items.map((it, idx) => ({
        id: it.id,
        weightage_percent: Number(it.weightage_percent),
        sort_order: idx + 1,
        is_active: true,
      }))
      await kraConfigsApi.bulkUpdate(payload)

      // Also persist title/description changes if any
      for (const it of items) {
        await kraConfigsApi.update(it.id, {
          title: it.title,
          description: it.description ?? undefined,
          weightage_percent: Number(it.weightage_percent),
        })
      }

      alerts.success('KRA configuration saved successfully', {
        description: 'New weightages and indicators are now active for upcoming appraisals.',
      })
      void query.refetch()
      onClose()
    } catch (err: unknown) {
      alerts.error(err instanceof Error ? err.message : 'Failed to save KRA config')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddNewKra = async () => {
    if (!newTitle.trim() || !newCode.trim()) {
      alerts.error('Please enter title and unique code')
      return
    }

    try {
      setIsSubmittingNew(true)
      const created = await kraConfigsApi.create({
        code: newCode.trim().toLowerCase().replace(/\s+/g, '_'),
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        category: newCategory,
        weightage_percent: Number(newWeight),
        sort_order: items.length + 1,
      })
      setItems((prev) => [...prev, created])
      alerts.success('New KRA added', { description: created.title })
      setIsAddingNew(false)
      setNewTitle('')
      setNewCode('')
      setNewDescription('')
      setNewWeight(15)
      void query.refetch()
    } catch (err: unknown) {
      alerts.error(err instanceof Error ? err.message : 'Failed to add KRA')
    } finally {
      setIsSubmittingNew(false)
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(op) => !op && onClose()}
      title='Key Result Areas (KRAs) Configuration'
      description='Customize evaluation criteria and percentage weightages for teacher & staff performance appraisals.'
      size='xl'
    >
      <div className='flex flex-col gap-4 text-xs max-h-[75vh] overflow-y-auto pr-1'>
        {/* Total Weightage Status Banner */}
        <div
          className={`flex items-center justify-between p-3 rounded-lg border ${
            isWeightValid
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300'
          }`}
        >
          <div className='flex items-center gap-2'>
            {isWeightValid ? (
              <CheckCircle2 className='h-4 w-4 shrink-0 text-emerald-600' />
            ) : (
              <AlertCircle className='h-4 w-4 shrink-0 text-amber-600' />
            )}
            <div>
              <span className='font-semibold text-xs'>
                Total Weightage: {totalWeight.toFixed(1)}% / 100%
              </span>
              <p className='text-[11px] opacity-90'>
                {isWeightValid
                  ? 'Criteria weights are perfectly balanced and ready for evaluations.'
                  : totalWeight < 100
                  ? `Please allocate the remaining ${(100 - totalWeight).toFixed(1)}% across KRAs.`
                  : `Total weight exceeds 100% by ${(totalWeight - 100).toFixed(1)}%. Please reduce weights.`}
              </p>
            </div>
          </div>
          <Badge tone={isWeightValid ? 'success' : 'warning'}>
            {isWeightValid ? 'Balanced 100%' : `${totalWeight.toFixed(1)}%`}
          </Badge>
        </div>

        {/* Action Header */}
        <div className='flex items-center justify-between'>
          <span className='text-xs font-semibold text-foreground'>
            Active Evaluation Dimensions ({items.length})
          </span>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              className='text-xs'
              onClick={() => void handleResetDefaults()}
              disabled={isResetting}
            >
              <RotateCcw className='mr-1.5 h-3.5 w-3.5' />
              {isResetting ? 'Resetting…' : 'Reset to Standard Template'}
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='text-xs text-primary'
              onClick={() => setIsAddingNew(!isAddingNew)}
            >
              <Plus className='mr-1 h-3.5 w-3.5' />
              Add Custom KRA
            </Button>
          </div>
        </div>

        {/* Add New KRA Inline Drawer */}
        {isAddingNew && (
          <div className='rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-3'>
            <h4 className='font-semibold text-xs text-primary flex items-center gap-1.5'>
              <Sliders className='h-3.5 w-3.5' />
              Add New Key Result Area
            </h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <FormField id='new-kra-title' label='KRA Title' required>
                <Input
                  id='new-kra-title'
                  placeholder='e.g. STEM Project Leadership'
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value)
                    if (!newCode) {
                      setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'))
                    }
                  }}
                />
              </FormField>

              <FormField id='new-kra-code' label='KRA Slug / Code' required>
                <Input
                  id='new-kra-code'
                  placeholder='e.g. stem_leadership'
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                />
              </FormField>

              <FormField id='new-kra-weight' label='Weightage %' required>
                <Input
                  id='new-kra-weight'
                  type='number'
                  min={1}
                  max={100}
                  value={newWeight}
                  onChange={(e) => setNewWeight(Number(e.target.value))}
                />
              </FormField>

              <FormField id='new-kra-category' label='Category'>
                <select
                  id='new-kra-category'
                  className='w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs'
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as typeof newCategory)}
                >
                  <option value='pedagogy'>Pedagogy & Teaching</option>
                  <option value='academics'>Academics & Outcomes</option>
                  <option value='administrative'>Administrative & Discipline</option>
                  <option value='extracurricular'>Extracurricular & Initiatives</option>
                  <option value='general'>General & Parent Relations</option>
                </select>
              </FormField>

              <div className='sm:col-span-2'>
                <FormField id='new-kra-desc' label='Evaluation Guidelines / Description'>
                  <Textarea
                    id='new-kra-desc'
                    rows={2}
                    placeholder='What should the evaluator look for when scoring 1 to 5?'
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </FormField>
              </div>
            </div>

            <div className='flex justify-end gap-2 pt-1'>
              <Button
                variant='ghost'
                size='sm'
                className='text-xs'
                onClick={() => setIsAddingNew(false)}
              >
                Cancel
              </Button>
              <Button
                variant='default'
                size='sm'
                className='text-xs'
                onClick={() => void handleAddNewKra()}
                disabled={isSubmittingNew}
              >
                {isSubmittingNew ? 'Saving…' : 'Add KRA'}
              </Button>
            </div>
          </div>
        )}

        {/* Existing KRAs List */}
        <div className='space-y-3'>
          {items.map((kra, index) => (
            <div
              key={kra.id}
              className='rounded-lg border border-border bg-card p-3 space-y-2'
            >
              <div className='flex items-start justify-between gap-2'>
                <div className='flex items-center gap-2 flex-1'>
                  <span className='flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground'>
                    {index + 1}
                  </span>
                  <div className='flex-1'>
                    <Input
                      className='h-8 text-xs font-semibold'
                      value={kra.title}
                      onChange={(e) => handleTitleChange(kra.id, e.target.value)}
                    />
                  </div>
                  <Badge tone='neutral' className='capitalize shrink-0'>
                    {kra.category}
                  </Badge>
                </div>

                <div className='flex items-center gap-2 shrink-0'>
                  <div className='flex items-center gap-1'>
                    <Label htmlFor={`weight-${kra.id}`} className='text-[11px] text-muted-foreground'>
                      Weight:
                    </Label>
                    <Input
                      id={`weight-${kra.id}`}
                      type='number'
                      min={0}
                      max={100}
                      className='h-8 w-16 text-center text-xs font-bold'
                      value={kra.weightage_percent}
                      onChange={(e) => handleWeightChange(kra.id, Number(e.target.value))}
                    />
                    <span className='font-bold text-muted-foreground'>%</span>
                  </div>

                  {items.length > 1 && (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0 text-muted-foreground hover:text-danger'
                      onClick={() => void handleDeleteKra(kra.id)}
                      title='Deactivate KRA'
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Input
                  className='h-7 text-[11px] text-muted-foreground bg-muted/20'
                  placeholder='Evaluation guidance benchmarks for evaluator…'
                  value={kra.description ?? ''}
                  onChange={(e) => handleDescriptionChange(kra.id, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Modal Action Footer */}
        <div className='flex items-center justify-between border-t border-border pt-3'>
          <span className='text-[11px] text-muted-foreground'>
            Evaluator scores will be dynamically weighted by these percentages.
          </span>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant='default'
              size='sm'
              onClick={() => void handleSaveAll()}
              disabled={isSaving || !isWeightValid}
            >
              <Save className='mr-1.5 h-3.5 w-3.5' />
              {isSaving ? 'Saving…' : 'Save KRA Config'}
            </Button>
          </div>
        </div>
      </div>
    </AppModal>
  )
}
