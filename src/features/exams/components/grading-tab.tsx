import { useState } from 'react'
import { Check, CheckCircle2, Plus, Sliders, Sparkles, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  useGradingScales,
  useSaveGradingScale,
  useSetDefaultGradingScale,
  type GradingTier,
} from '../api'

const PRESETS: Record<string, { name: string; tiers: GradingTier[] }> = {
  CBSE: {
    name: 'CBSE Standard 8-Tier Scale',
    tiers: [
      { grade: 'A1', min_percentage: 91, max_percentage: 100, grade_point: 10.0, description: 'Outstanding' },
      { grade: 'A2', min_percentage: 81, max_percentage: 90, grade_point: 9.0, description: 'Excellent' },
      { grade: 'B1', min_percentage: 71, max_percentage: 80, grade_point: 8.0, description: 'Very Good' },
      { grade: 'B2', min_percentage: 61, max_percentage: 70, grade_point: 7.0, description: 'Good' },
      { grade: 'C1', min_percentage: 51, max_percentage: 60, grade_point: 6.0, description: 'Above Average' },
      { grade: 'C2', min_percentage: 41, max_percentage: 50, grade_point: 5.0, description: 'Average' },
      { grade: 'D', min_percentage: 33, max_percentage: 40, grade_point: 4.0, description: 'Pass' },
      { grade: 'E', min_percentage: 0, max_percentage: 32, grade_point: 0.0, description: 'Needs Improvement / Fail' },
    ],
  },
  STATE: {
    name: 'State Board 5-Tier Scale',
    tiers: [
      { grade: 'A+', min_percentage: 80, max_percentage: 100, grade_point: 10.0, description: 'Distinction' },
      { grade: 'A', min_percentage: 60, max_percentage: 79, grade_point: 8.0, description: 'First Class' },
      { grade: 'B', min_percentage: 50, max_percentage: 59, grade_point: 6.0, description: 'Second Class' },
      { grade: 'C', min_percentage: 35, max_percentage: 49, grade_point: 4.0, description: 'Third Class / Pass' },
      { grade: 'Fail', min_percentage: 0, max_percentage: 34, grade_point: 0.0, description: 'Fail / Needs Improvement' },
    ],
  },
  ICSE: {
    name: 'ICSE 8-Point Scale',
    tiers: [
      { grade: '1', min_percentage: 90, max_percentage: 100, grade_point: 10.0, description: 'Outstanding' },
      { grade: '2', min_percentage: 80, max_percentage: 89, grade_point: 9.0, description: 'Very Good' },
      { grade: '3', min_percentage: 70, max_percentage: 79, grade_point: 8.0, description: 'Good' },
      { grade: '4', min_percentage: 60, max_percentage: 69, grade_point: 7.0, description: 'Satisfactory' },
      { grade: '5', min_percentage: 50, max_percentage: 59, grade_point: 6.0, description: 'Fair' },
      { grade: '6', min_percentage: 40, max_percentage: 49, grade_point: 5.0, description: 'Pass' },
      { grade: '7', min_percentage: 33, max_percentage: 39, grade_point: 4.0, description: 'Borderline Pass' },
      { grade: '8', min_percentage: 0, max_percentage: 32, grade_point: 0.0, description: 'Fail' },
    ],
  },
}

interface GradingTabProps {
  canManage: boolean
}

export function GradingTab({ canManage }: GradingTabProps) {
  const scalesQuery = useGradingScales()
  const scales = scalesQuery.data ?? []

  const saveMutation = useSaveGradingScale()
  const setDefaultMutation = useSetDefaultGradingScale()

  const [selectedBoard, setSelectedBoard] = useState<'CBSE' | 'STATE' | 'ICSE' | 'CUSTOM'>('CBSE')
  const [scaleName, setScaleName] = useState('CBSE Standard 8-Tier Scale')
  const [tiers, setTiers] = useState<GradingTier[]>(PRESETS.CBSE.tiers)

  // Interactive Test Calculator
  const [testPercent, setTestPercent] = useState<number>(78)
  const evaluatedGrade = tiers.find((t) => testPercent >= t.min_percentage && testPercent <= t.max_percentage)

  const handleSelectPreset = (board: 'CBSE' | 'STATE' | 'ICSE') => {
    setSelectedBoard(board)
    setScaleName(PRESETS[board].name)
    setTiers([...PRESETS[board].tiers])
  }

  const handleUpdateTier = (idx: number, field: keyof GradingTier, value: string | number) => {
    setTiers((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
    setSelectedBoard('CUSTOM')
  }

  const handleAddTier = () => {
    setTiers((prev) => [
      ...prev,
      { grade: 'New', min_percentage: 0, max_percentage: 0, grade_point: 0, description: '' },
    ])
    setSelectedBoard('CUSTOM')
  }

  const handleRemoveTier = (idx: number) => {
    if (tiers.length <= 1) return
    setTiers((prev) => prev.filter((_, i) => i !== idx))
    setSelectedBoard('CUSTOM')
  }

  const handleSaveScale = async () => {
    if (!scaleName.trim()) {
      alerts.error('Grading scale name is required')
      return
    }
    try {
      await saveMutation.mutateAsync({
        board: selectedBoard,
        name: scaleName.trim(),
        is_default: true,
        tiers,
      })
      alerts.success('Grading scale saved successfully')
    } catch (err) {
      alerts.error(toApiError(err).message)
    }
  }

  return (
    <div className='space-y-8'>
      {/* 1. Header Card */}
      <Card className='p-5 shadow-sm'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <Sliders className='h-6 w-6 text-emerald-600' />
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>Grading Scales & Assessment Rules</h2>
              <p className='text-xs text-gray-500'>
                Configure CBSE 8-tier, State Board 5-tier (Distinction/First Class), ICSE, or Custom grading cutoffs.
              </p>
            </div>
          </div>

          {canManage && (
            <Button
              onClick={handleSaveScale}
              disabled={saveMutation.isPending}
              className='bg-emerald-600 text-white hover:bg-emerald-700'
            >
              <Check className='mr-1.5 h-4 w-4' /> Save as School Default
            </Button>
          )}
        </div>
      </Card>

      {/* 2. Board Presets Quick Bar */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <label className='text-sm font-semibold text-gray-800'>Choose Assessment Board Preset</label>
          <span className='text-xs text-gray-500'>Click a preset to quickly load board standard tiers</span>
        </div>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
          <Card
            onClick={() => handleSelectPreset('CBSE')}
            className={`p-4 cursor-pointer border-2 transition-all hover:border-emerald-500 ${
              selectedBoard === 'CBSE' ? 'border-emerald-600 bg-emerald-50/40 shadow-sm' : 'border-gray-200'
            }`}
          >
            <div className='flex items-center justify-between'>
              <h4 className='font-semibold text-gray-900'>CBSE Board (8-Tier)</h4>
              {selectedBoard === 'CBSE' && <CheckCircle2 className='h-4 w-4 text-emerald-600' />}
            </div>
            <p className='mt-1 text-xs text-gray-500'>A1 (91-100) down to E (Needs Improvement)</p>
          </Card>

          <Card
            onClick={() => handleSelectPreset('STATE')}
            className={`p-4 cursor-pointer border-2 transition-all hover:border-emerald-500 ${
              selectedBoard === 'STATE' ? 'border-emerald-600 bg-emerald-50/40 shadow-sm' : 'border-gray-200'
            }`}
          >
            <div className='flex items-center justify-between'>
              <h4 className='font-semibold text-gray-900'>State Board (5-Tier)</h4>
              {selectedBoard === 'STATE' && <CheckCircle2 className='h-4 w-4 text-emerald-600' />}
            </div>
            <p className='mt-1 text-xs text-gray-500'>Distinction (80+), 1st Class (60-79), 2nd Class, Pass, Fail</p>
          </Card>

          <Card
            onClick={() => handleSelectPreset('ICSE')}
            className={`p-4 cursor-pointer border-2 transition-all hover:border-emerald-500 ${
              selectedBoard === 'ICSE' ? 'border-emerald-600 bg-emerald-50/40 shadow-sm' : 'border-gray-200'
            }`}
          >
            <div className='flex items-center justify-between'>
              <h4 className='font-semibold text-gray-900'>ICSE Board (8-Point)</h4>
              {selectedBoard === 'ICSE' && <CheckCircle2 className='h-4 w-4 text-emerald-600' />}
            </div>
            <p className='mt-1 text-xs text-gray-500'>Points 1 (90-100) through 8 (Fail)</p>
          </Card>
        </div>
      </div>

      {/* 3. Scale Configuration Details & Live Calculator */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2 space-y-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <Input
                value={scaleName}
                onChange={(e) => setScaleName(e.target.value)}
                className='font-semibold w-[280px]'
                placeholder='Scale Name'
              />
              <Badge tone='neutral'>{selectedBoard}</Badge>
            </div>

            {canManage && (
              <Button variant='outline' size='sm' onClick={handleAddTier} className='gap-1.5 text-xs'>
                <Plus className='h-3.5 w-3.5' /> Add Grade Tier
              </Button>
            )}
          </div>

          <Card className='overflow-hidden'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold border-b'>
                <tr>
                  <th className='p-3'>Grade</th>
                  <th className='p-3'>Min %</th>
                  <th className='p-3'>Max %</th>
                  <th className='p-3'>Grade Point</th>
                  <th className='p-3'>Remarks / Descriptor</th>
                  {canManage && <th className='p-3 text-right'>Action</th>}
                </tr>
              </thead>
              <tbody className='divide-y'>
                {tiers.map((tier, idx) => (
                  <tr key={idx} className='hover:bg-gray-50'>
                    <td className='p-2'>
                      <Input
                        value={tier.grade}
                        onChange={(e) => handleUpdateTier(idx, 'grade', e.target.value)}
                        className='h-8 w-16 text-xs font-bold text-emerald-700'
                      />
                    </td>
                    <td className='p-2'>
                      <Input
                        type='number'
                        value={tier.min_percentage}
                        onChange={(e) => handleUpdateTier(idx, 'min_percentage', Number(e.target.value))}
                        className='h-8 w-18 text-xs'
                      />
                    </td>
                    <td className='p-2'>
                      <Input
                        type='number'
                        value={tier.max_percentage}
                        onChange={(e) => handleUpdateTier(idx, 'max_percentage', Number(e.target.value))}
                        className='h-8 w-18 text-xs'
                      />
                    </td>
                    <td className='p-2'>
                      <Input
                        type='number'
                        step='0.1'
                        value={tier.grade_point ?? 0}
                        onChange={(e) => handleUpdateTier(idx, 'grade_point', Number(e.target.value))}
                        className='h-8 w-16 text-xs'
                      />
                    </td>
                    <td className='p-2'>
                      <Input
                        value={tier.description ?? ''}
                        onChange={(e) => handleUpdateTier(idx, 'description', e.target.value)}
                        className='h-8 text-xs'
                        placeholder='e.g. Outstanding'
                      />
                    </td>
                    {canManage && (
                      <td className='p-2 text-right'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-7 w-7 text-red-500 hover:bg-red-50'
                          onClick={() => handleRemoveTier(idx)}
                          disabled={tiers.length <= 1}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* 4. Live Evaluator & Saved Scales List */}
        <div className='space-y-4'>
          {/* Interactive Calculator */}
          <Card className='p-4 space-y-3 bg-gradient-to-br from-emerald-50/50 to-white border-emerald-100'>
            <div className='flex items-center gap-2 text-emerald-800 font-semibold text-sm'>
              <Sparkles className='h-4 w-4' /> Live Cutoff Tester
            </div>
            <p className='text-xs text-gray-500'>
              Test any test percentage against these tiers to preview the calculated grade.
            </p>
            <div className='space-y-1.5'>
              <label className='text-xs font-medium text-gray-700'>Sample Percentage</label>
              <div className='flex items-center gap-2'>
                <Input
                  type='number'
                  min={0}
                  max={100}
                  value={testPercent}
                  onChange={(e) => setTestPercent(Number(e.target.value))}
                  className='h-9 w-24'
                />
                <span className='text-sm font-semibold text-gray-600'>%</span>
              </div>
            </div>

            <div className='mt-3 rounded-lg border border-emerald-200 bg-white p-3 text-center'>
              <p className='text-xs text-gray-500'>Yields Grade</p>
              <p className='text-2xl font-bold text-emerald-700'>
                {evaluatedGrade?.grade ?? '—'}
              </p>
              <p className='text-xs text-emerald-600 font-medium'>
                {evaluatedGrade?.description ?? 'No tier matched'}
              </p>
            </div>
          </Card>

          {/* Configured Scales */}
          <Card className='p-4 space-y-3'>
            <h4 className='font-semibold text-sm text-gray-900'>Saved School Grading Scales</h4>
            {scales.length === 0 ? (
              <p className='text-xs text-gray-500'>
                No custom scales saved yet. The system is currently applying the default CBSE 8-tier scale.
              </p>
            ) : (
              <div className='space-y-2'>
                {scales.map((s) => (
                  <div
                    key={s.id}
                    className='flex items-center justify-between p-2.5 rounded border hover:bg-gray-50 text-xs'
                  >
                    <div>
                      <p className='font-medium text-gray-900'>{s.name}</p>
                      <p className='text-[10px] text-gray-500'>{s.board} • {s.tiers.length} tiers</p>
                    </div>
                    {s.is_default ? (
                      <Badge tone='success'>Default</Badge>
                    ) : (
                      canManage && (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-6 text-[10px]'
                          onClick={async () => {
                            await setDefaultMutation.mutateAsync(s.id)
                            alerts.success(`Set ${s.name} as default`)
                          }}
                        >
                          Set Default
                        </Button>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
