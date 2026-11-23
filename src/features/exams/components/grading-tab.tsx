import { useState } from 'react'
import { Calculator, Check, CheckCircle2, FileSpreadsheet, Plus, Sliders, Sparkles, Trash2 } from 'lucide-react'
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
  STATE_60_40: {
    name: 'State Board 60:40 CCE Scale (Written 60% + FA 40%)',
    tiers: [
      { grade: 'A1', min_percentage: 91, max_percentage: 100, grade_point: 10.0, description: 'Outstanding (91-100 Final Total)' },
      { grade: 'A2', min_percentage: 81, max_percentage: 90, grade_point: 9.0, description: 'Excellent (81-90 Final Total)' },
      { grade: 'B1', min_percentage: 71, max_percentage: 80, grade_point: 8.0, description: 'Very Good (71-80 Final Total)' },
      { grade: 'B2', min_percentage: 61, max_percentage: 70, grade_point: 7.0, description: 'Good (61-70 Final Total)' },
      { grade: 'C1', min_percentage: 51, max_percentage: 60, grade_point: 6.0, description: 'Above Average (51-60 Final Total)' },
      { grade: 'C2', min_percentage: 41, max_percentage: 50, grade_point: 5.0, description: 'Average (41-50 Final Total)' },
      { grade: 'D', min_percentage: 35, max_percentage: 40, grade_point: 4.0, description: 'Pass (35-40 Final Total)' },
      { grade: 'E', min_percentage: 0, max_percentage: 34, grade_point: 0.0, description: 'Needs Improvement / Fail (< 35)' },
    ],
  },
  STATE: {
    name: 'State Board CCE 10-Point Scale',
    tiers: [
      { grade: 'A1', min_percentage: 91, max_percentage: 100, grade_point: 10.0, description: 'Outstanding (Grade Point 10)' },
      { grade: 'A2', min_percentage: 81, max_percentage: 90, grade_point: 9.0, description: 'Excellent (Grade Point 9)' },
      { grade: 'B1', min_percentage: 71, max_percentage: 80, grade_point: 8.0, description: 'Very Good (Grade Point 8)' },
      { grade: 'B2', min_percentage: 61, max_percentage: 70, grade_point: 7.0, description: 'Good (Grade Point 7)' },
      { grade: 'C1', min_percentage: 51, max_percentage: 60, grade_point: 6.0, description: 'Above Average (Grade Point 6)' },
      { grade: 'C2', min_percentage: 41, max_percentage: 50, grade_point: 5.0, description: 'Average (Grade Point 5)' },
      { grade: 'D', min_percentage: 35, max_percentage: 40, grade_point: 4.0, description: 'Pass (Grade Point 4)' },
      { grade: 'E', min_percentage: 0, max_percentage: 34, grade_point: 0.0, description: 'Needs Improvement / Fail' },
    ],
  },
  STATE_FA_A: {
    name: 'State Board FA(a) (Activity & Projects - 20 Marks)',
    tiers: [
      { grade: 'O', min_percentage: 90, max_percentage: 100, grade_point: 10.0, description: 'Outstanding (18-20 Marks) - CCE Tool 1 & 2' },
      { grade: 'A', min_percentage: 75, max_percentage: 89, grade_point: 8.5, description: 'Very Good (15-17.5 Marks) - CCE Tool 1 & 2' },
      { grade: 'B', min_percentage: 60, max_percentage: 74, grade_point: 7.0, description: 'Good (12-14.5 Marks) - CCE Tool 1 & 2' },
      { grade: 'C', min_percentage: 35, max_percentage: 59, grade_point: 5.0, description: 'Pass (7-11.5 Marks) - CCE Tool 1 & 2' },
      { grade: 'D', min_percentage: 0, max_percentage: 34, grade_point: 0.0, description: 'Needs Improvement (0-6.5 Marks)' },
    ],
  },
  STATE_FA_B: {
    name: 'State Board FA(b) (Slip Test & Assignments - 20 Marks)',
    tiers: [
      { grade: 'O', min_percentage: 90, max_percentage: 100, grade_point: 10.0, description: 'Outstanding (18-20 Marks) - CCE Tool 3 & 4' },
      { grade: 'A', min_percentage: 75, max_percentage: 89, grade_point: 8.5, description: 'Very Good (15-17.5 Marks) - CCE Tool 3 & 4' },
      { grade: 'B', min_percentage: 60, max_percentage: 74, grade_point: 7.0, description: 'Good (12-14.5 Marks) - CCE Tool 3 & 4' },
      { grade: 'C', min_percentage: 35, max_percentage: 59, grade_point: 5.0, description: 'Pass (7-11.5 Marks) - CCE Tool 3 & 4' },
      { grade: 'D', min_percentage: 0, max_percentage: 34, grade_point: 0.0, description: 'Needs Improvement (0-6.5 Marks)' },
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

  const [selectedBoard, setSelectedBoard] = useState<'CBSE' | 'STATE_60_40' | 'STATE' | 'STATE_FA_A' | 'STATE_FA_B' | 'ICSE' | 'CUSTOM'>('STATE_60_40')
  const [scaleName, setScaleName] = useState(PRESETS.STATE_60_40.name)
  const [tiers, setTiers] = useState<GradingTier[]>(PRESETS.STATE_60_40.tiers)

  // Standard Percentage Tester
  const [testPercent, setTestPercent] = useState<number>(78)
  const evaluatedGrade = tiers.find((t) => testPercent >= t.min_percentage && testPercent <= t.max_percentage)

  // State Board 60:40 CCE Live Formula Calculator
  const [writtenMarks, setWrittenMarks] = useState<number>(80) // out of 100
  const [faaMarks, setFaaMarks] = useState<number>(18) // out of 20
  const [fabMarks, setFabMarks] = useState<number>(17) // out of 20

  const scaledWritten = Math.round(((writtenMarks / 100) * 60) * 10) / 10
  const finalCceTotal = Math.min(100, Math.round((scaledWritten + faaMarks + fabMarks) * 10) / 10)
  const evaluatedCceGrade = tiers.find((t) => Math.round(finalCceTotal) >= t.min_percentage && Math.round(finalCceTotal) <= t.max_percentage)

  const handleSelectPreset = (board: 'CBSE' | 'STATE_60_40' | 'STATE' | 'STATE_FA_A' | 'STATE_FA_B' | 'ICSE') => {
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
                Configure State Board 60:40 CCE, CBSE 8-tier, ICSE, or Custom grading cutoffs.
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

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6'>
          <Card
            onClick={() => handleSelectPreset('STATE_60_40')}
            className={`p-3.5 cursor-pointer border-2 transition-all hover:border-emerald-500 ${
              selectedBoard === 'STATE_60_40' ? 'border-emerald-600 bg-emerald-50/40 shadow-sm' : 'border-gray-200'
            }`}
          >
            <div className='flex items-center justify-between'>
              <h4 className='font-semibold text-gray-900 text-xs sm:text-sm'>State CCE 60:40</h4>
              {selectedBoard === 'STATE_60_40' && <CheckCircle2 className='h-4 w-4 text-emerald-600' />}
            </div>
            <p className='mt-1 text-[11px] text-gray-500'>Written 60% + FA(a) 20m + FA(b) 20m = 100m</p>
          </Card>

          <Card
            onClick={() => handleSelectPreset('STATE')}
            className={`p-3.5 cursor-pointer border-2 transition-all hover:border-emerald-500 ${
              selectedBoard === 'STATE' ? 'border-emerald-600 bg-emerald-50/40 shadow-sm' : 'border-gray-200'
            }`}
          >
            <div className='flex items-center justify-between'>
              <h4 className='font-semibold text-gray-900 text-xs sm:text-sm'>State CCE (10-Pt)</h4>
              {selectedBoard === 'STATE' && <CheckCircle2 className='h-4 w-4 text-emerald-600' />}
            </div>
            <p className='mt-1 text-[11px] text-gray-500'>A1 (91+) down to E (Fail) - 10 Point Scale</p>
          </Card>

          <Card
            onClick={() => handleSelectPreset('STATE_FA_A')}
            className={`p-3.5 cursor-pointer border-2 transition-all hover:border-emerald-500 ${
              selectedBoard === 'STATE_FA_A' ? 'border-emerald-600 bg-emerald-50/40 shadow-sm' : 'border-gray-200'
            }`}
          >
            <div className='flex items-center justify-between'>
              <h4 className='font-semibold text-gray-900 text-xs sm:text-sm'>State FA(a) (20m)</h4>
              {selectedBoard === 'STATE_FA_A' && <CheckCircle2 className='h-4 w-4 text-emerald-600' />}
            </div>
            <p className='mt-1 text-[11px] text-gray-500'>Activities, Projects & Reflections (Tools 1 & 2)</p>
          </Card>

          <Card
            onClick={() => handleSelectPreset('STATE_FA_B')}
            className={`p-3.5 cursor-pointer border-2 transition-all hover:border-emerald-500 ${
              selectedBoard === 'STATE_FA_B' ? 'border-emerald-600 bg-emerald-50/40 shadow-sm' : 'border-gray-200'
            }`}
          >
            <div className='flex items-center justify-between'>
              <h4 className='font-semibold text-gray-900 text-xs sm:text-sm'>State FA(b) (20m)</h4>
              {selectedBoard === 'STATE_FA_B' && <CheckCircle2 className='h-4 w-4 text-emerald-600' />}
            </div>
            <p className='mt-1 text-[11px] text-gray-500'>Slip Tests & Written Work (Tools 3 & 4)</p>
          </Card>

          <Card
            onClick={() => handleSelectPreset('CBSE')}
            className={`p-3.5 cursor-pointer border-2 transition-all hover:border-emerald-500 ${
              selectedBoard === 'CBSE' ? 'border-emerald-600 bg-emerald-50/40 shadow-sm' : 'border-gray-200'
            }`}
          >
            <div className='flex items-center justify-between'>
              <h4 className='font-semibold text-gray-900 text-xs sm:text-sm'>CBSE (8-Tier)</h4>
              {selectedBoard === 'CBSE' && <CheckCircle2 className='h-4 w-4 text-emerald-600' />}
            </div>
            <p className='mt-1 text-[11px] text-gray-500'>A1 (91-100) down to E (Needs Improvement)</p>
          </Card>

          <Card
            onClick={() => handleSelectPreset('ICSE')}
            className={`p-3.5 cursor-pointer border-2 transition-all hover:border-emerald-500 ${
              selectedBoard === 'ICSE' ? 'border-emerald-600 bg-emerald-50/40 shadow-sm' : 'border-gray-200'
            }`}
          >
            <div className='flex items-center justify-between'>
              <h4 className='font-semibold text-gray-900 text-xs sm:text-sm'>ICSE (8-Point)</h4>
              {selectedBoard === 'ICSE' && <CheckCircle2 className='h-4 w-4 text-emerald-600' />}
            </div>
            <p className='mt-1 text-[11px] text-gray-500'>Points 1 (90-100) down to 8 (Fail)</p>
          </Card>
        </div>
      </div>

      {/* 2.5 State Board 60:40 CCE Weightage Formula Card */}
      <Card className='p-4 border-l-4 border-l-emerald-600 bg-emerald-50/30'>
        <div className='flex items-start gap-3'>
          <FileSpreadsheet className='h-5 w-5 text-emerald-700 mt-0.5 shrink-0' />
          <div className='space-y-1.5 text-xs text-gray-700'>
            <h4 className='font-semibold text-sm text-gray-900'>
              State Board CCE 60:40 Weightage Formula Explained
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-3 pt-1'>
              <div className='rounded bg-white p-2.5 border shadow-2xs'>
                <p className='font-semibold text-emerald-800 text-[11px] uppercase tracking-wide'>1. Written Test (100m)</p>
                <p className='text-xs mt-1 text-gray-600'>
                  Written test is conducted out of <strong>100 Marks</strong>, then calculated down to <strong>60 Marks</strong>:
                </p>
                <p className='font-mono font-bold text-emerald-700 text-xs mt-1'>
                  Scaled = (Score ÷ 100) × 60
                </p>
              </div>

              <div className='rounded bg-white p-2.5 border shadow-2xs'>
                <p className='font-semibold text-emerald-800 text-[11px] uppercase tracking-wide'>2. FA(a) Activities (20m)</p>
                <p className='text-xs mt-1 text-gray-600'>
                  Internal Tool 1 & 2: Classroom project work, lab experiments, chart preparation & oral presentation.
                </p>
                <p className='font-mono font-bold text-emerald-700 text-xs mt-1'>Max: 20 Marks</p>
              </div>

              <div className='rounded bg-white p-2.5 border shadow-2xs'>
                <p className='font-semibold text-emerald-800 text-[11px] uppercase tracking-wide'>3. FA(b) Slip Tests (20m)</p>
                <p className='text-xs mt-1 text-gray-600'>
                  Internal Tool 3 & 4: Slip tests, student notebooks, homework exercises & written assignments.
                </p>
                <p className='font-mono font-bold text-emerald-700 text-xs mt-1'>Max: 20 Marks</p>
              </div>

              <div className='rounded bg-emerald-100/60 p-2.5 border border-emerald-300 shadow-2xs'>
                <p className='font-semibold text-emerald-900 text-[11px] uppercase tracking-wide'>4. Final Total (100m)</p>
                <p className='text-xs mt-1 text-gray-700'>
                  All 3 components are summed to produce final mark & grade:
                </p>
                <p className='font-mono font-bold text-emerald-900 text-xs mt-1'>
                  Total = Scaled (60) + FAa (20) + FAb (20)
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Scale Configuration Details & Live Calculator */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2 space-y-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <Input
                value={scaleName}
                onChange={(e) => setScaleName(e.target.value)}
                className='font-semibold w-[320px]'
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
          {/* Interactive State Board 60:40 CCE Calculator */}
          <Card className='p-4 space-y-3 bg-gradient-to-br from-emerald-50/60 to-white border-emerald-200'>
            <div className='flex items-center gap-2 text-emerald-900 font-semibold text-sm'>
              <Calculator className='h-4 w-4 text-emerald-700' /> State Board 60:40 Live Tester
            </div>
            <p className='text-xs text-gray-500'>
              Enter test and activity marks to preview live 60:40 scaling and resulting grade:
            </p>

            <div className='space-y-2.5 pt-1'>
              <div className='flex items-center justify-between text-xs'>
                <label className='font-medium text-gray-700'>Written Exam (out of 100):</label>
                <div className='flex items-center gap-1.5'>
                  <Input
                    type='number'
                    min={0}
                    max={100}
                    value={writtenMarks}
                    onChange={(e) => setWrittenMarks(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className='h-8 w-20 text-xs text-right'
                  />
                  <span className='text-[10px] text-gray-500'>/ 100</span>
                </div>
              </div>

              <div className='flex items-center justify-between text-xs bg-emerald-50/50 p-1.5 rounded border border-emerald-100'>
                <span className='text-emerald-800 font-medium'>Scaled to 60 (Written × 0.6):</span>
                <span className='font-mono font-bold text-emerald-700'>{scaledWritten} / 60</span>
              </div>

              <div className='flex items-center justify-between text-xs'>
                <label className='font-medium text-gray-700'>FA(a) Activity (out of 20):</label>
                <div className='flex items-center gap-1.5'>
                  <Input
                    type='number'
                    min={0}
                    max={20}
                    value={faaMarks}
                    onChange={(e) => setFaaMarks(Math.max(0, Math.min(20, Number(e.target.value))))}
                    className='h-8 w-20 text-xs text-right'
                  />
                  <span className='text-[10px] text-gray-500'>/ 20</span>
                </div>
              </div>

              <div className='flex items-center justify-between text-xs'>
                <label className='font-medium text-gray-700'>FA(b) Slip Test (out of 20):</label>
                <div className='flex items-center gap-1.5'>
                  <Input
                    type='number'
                    min={0}
                    max={20}
                    value={fabMarks}
                    onChange={(e) => setFabMarks(Math.max(0, Math.min(20, Number(e.target.value))))}
                    className='h-8 w-20 text-xs text-right'
                  />
                  <span className='text-[10px] text-gray-500'>/ 20</span>
                </div>
              </div>

              <div className='mt-2 rounded-lg border border-emerald-300 bg-white p-3 text-center shadow-xs'>
                <p className='text-xs text-gray-500'>Combined Total Marks (out of 100)</p>
                <p className='text-2xl font-bold text-emerald-800 font-mono'>
                  {finalCceTotal} <span className='text-xs font-normal text-gray-500'>/ 100</span>
                </p>
                <div className='mt-1 inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 border border-emerald-200'>
                  <span className='text-xs font-bold text-emerald-800'>Grade {evaluatedCceGrade?.grade ?? '—'}</span>
                  {evaluatedCceGrade?.grade_point !== undefined && (
                    <span className='text-[10px] text-emerald-600 font-medium'>
                      ({evaluatedCceGrade.grade_point} GP)
                    </span>
                  )}
                </div>
                <p className='text-[11px] text-gray-500 mt-1'>
                  {evaluatedCceGrade?.description ?? 'No tier matched'}
                </p>
              </div>
            </div>
          </Card>

          {/* Simple Cutoff Percentage Tester */}
          <Card className='p-4 space-y-3 bg-gray-50/50'>
            <div className='flex items-center gap-2 text-gray-800 font-semibold text-xs'>
              <Sparkles className='h-3.5 w-3.5 text-gray-500' /> Standard Percentage Cutoff Tester
            </div>
            <div className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-1.5'>
                <Input
                  type='number'
                  min={0}
                  max={100}
                  value={testPercent}
                  onChange={(e) => setTestPercent(Number(e.target.value))}
                  className='h-8 w-20 text-xs'
                />
                <span className='text-xs font-semibold text-gray-600'>%</span>
              </div>
              <div className='text-right'>
                <span className='font-bold text-sm text-emerald-700'>{evaluatedGrade?.grade ?? '—'}</span>
                <span className='text-[11px] text-gray-500 ml-1.5'>({evaluatedGrade?.description ?? ''})</span>
              </div>
            </div>
          </Card>

          {/* Configured Scales */}
          <Card className='p-4 space-y-3'>
            <h4 className='font-semibold text-sm text-gray-900'>Saved School Grading Scales</h4>
            {scales.length === 0 ? (
              <p className='text-xs text-gray-500'>
                No custom scales saved yet. The system is applying the default State Board 60:40 CCE scale.
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
