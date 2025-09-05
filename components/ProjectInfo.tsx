import React, { useState } from 'react';
import type { ProjectParameters, QualityLevel } from '../types';
import { QUALITY_LEVELS, BASE_PARAMETER_BENCHMARKS } from '../constants';

interface ProjectInfoProps {
  parameters: ProjectParameters;
  setParameters: React.Dispatch<React.SetStateAction<ProjectParameters>>;
  totalHours: number;
  totalFTE: number;
  projectName: string;
  qualityLevel: QualityLevel;
  overheadTotals: {
    risks: number;
    management: number;
    general: number;
    vacation: number;
    sick_leave: number;
    meetings: number;
    onboarding: number;
  };
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`bg-card rounded-lg p-6 shadow-lg ${className}`}>
    <h3 className="text-lg font-bold text-card-foreground mb-4">{title}</h3>
    {children}
  </div>
);

const ParameterInput: React.FC<{ 
  label: string; 
  value: number; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  name: string; 
  hours: number;
}> = ({ label, value, onChange, name, hours }) => (
  <div className="flex items-center justify-between py-2">
    <label htmlFor={name} className="text-sm text-muted-foreground">{label}</label>
    <div className="flex items-center space-x-2">
      {/* Placeholder for alignment with deviation column in ParameterRow */}
      <div className="w-10" />
      
      <span className="text-sm w-12 text-right text-muted-foreground">{hours.toLocaleString()} ч</span>
      
      <div className="flex items-center">
        <input
          type="number"
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className="w-20 bg-input text-foreground text-right rounded-md p-1 border border-border focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="ml-2 w-[11px] text-muted-foreground">%</span>
      </div>
    </div>
  </div>
);

const ParameterRow: React.FC<{
  label: string;
  name: string;
  value: number;
  baseValue: number;
  comment?: string;
  commentName: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  hours?: number;
  isReadOnly?: boolean;
}> = ({ label, name, value, baseValue, comment, commentName, onChange, hours, isReadOnly = false }) => {
  const deviation = value - baseValue;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-sm text-muted-foreground">{label}</label>
        <div className="flex items-center space-x-2">
          {deviation !== 0 ? (
            <span className="text-sm font-bold text-destructive w-10 text-center">
              {deviation > 0 ? `+${deviation.toFixed(0)}` : deviation.toFixed(0)}%
            </span>
          ) : (
             <div className="w-10" />
          )}
          
          {typeof hours === 'number' ? (
            <span className="text-sm w-12 text-right text-muted-foreground">{hours.toLocaleString()} ч</span>
          ) : (
            <div className="w-12" />
          )}

          <div className="flex items-center">
            {isReadOnly ? (
              <span className="w-20 font-bold text-card-foreground text-right p-1">{value}%</span>
            ) : (
              <input
                type="number"
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className="w-20 bg-input text-foreground text-right rounded-md p-1 border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
            <span className="ml-2 w-[11px] text-muted-foreground">{!isReadOnly && '%'}</span>
          </div>
        </div>
      </div>
      {deviation !== 0 && (
        <div className="mt-2">
          <label htmlFor={commentName} className="text-xs text-muted-foreground">Комментарий (обязательно)</label>
          <textarea
            id={commentName}
            name={commentName}
            value={comment || ''}
            onChange={onChange}
            className="w-full mt-1 bg-input text-foreground rounded-md p-2 border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            rows={2}
            placeholder="Укажите причину отклонения от базового значения"
          />
        </div>
      )}
    </div>
  );
};

const Switch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; id: string; label: string; }> = ({ checked, onChange, id, label }) => (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        id={id}
        className={`${
          checked ? 'bg-primary' : 'bg-input'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
      >
        <span
          aria-hidden="true"
          className={`${
            checked ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
      <label htmlFor={id} className="text-sm text-muted-foreground cursor-pointer" onClick={() => onChange(!checked)}>{label}</label>
    </div>
  );

export const ProjectInfo: React.FC<ProjectInfoProps> = ({ parameters, setParameters, totalHours, totalFTE, projectName, qualityLevel, overheadTotals }) => {
  const [paramsCollapsed, setParamsCollapsed] = useState(false);
  
  const handleParameterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newParams = { 
      ...parameters, 
      [name]: e.target.type === 'number' ? Number(value) : value 
    };

    if (['vacation', 'sick_leave', 'meetings', 'onboarding'].includes(name)) {
        const generalTotal = newParams.vacation + newParams.sick_leave + newParams.meetings + newParams.onboarding;
        newParams.general = generalTotal;
    }
    setParameters(newParams);
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setParameters(prev => ({ ...prev, [name]: checked }));
  };

  const testingDeviation = parameters.testing - QUALITY_LEVELS[qualityLevel].parameters.testing;
  const showTestingComment = parameters.isManualTesting || (testingDeviation !== 0 && !parameters.isManualTesting);

  return (
    <div className="h-full flex flex-col gap-6">
      <InfoCard title="Название проекта" className="flex-shrink-0">
          <div className="space-y-3">
              <div className="flex justify-between">
                  <span className="text-muted-foreground">Название:</span>
                  <span className="font-semibold text-card-foreground">{projectName}</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-muted-foreground">Уровень качества:</span>
                  <span className="font-semibold text-card-foreground">{QUALITY_LEVELS[qualityLevel].name}</span>
              </div>
          </div>
      </InfoCard>

      <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary text-primary-foreground rounded-lg p-4 text-center shadow-lg">
              <div className="text-4xl font-bold">{totalHours.toLocaleString()}</div>
              <div className="text-sm uppercase tracking-wider">Итого трудозатраты (ч/ч)</div>
          </div>
          <div className="bg-secondary text-secondary-foreground rounded-lg p-4 text-center shadow-lg">
              <div className="text-4xl font-bold">{totalFTE.toFixed(2)}</div>
              <div className="text-sm uppercase tracking-wider">Кол-во FTE (шт)</div>
          </div>
      </div>

      <div className="bg-card rounded-lg p-6 shadow-lg flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-card-foreground">Параметры расчета</h3>
          <button
            onClick={() => setParamsCollapsed(c => !c)}
            className="px-3 py-1 text-sm rounded bg-secondary text-secondary-foreground hover:bg-secondary/80"
            aria-expanded={!paramsCollapsed}
          >
            {paramsCollapsed ? 'Развернуть' : 'Свернуть'}
          </button>
        </div>
        {!paramsCollapsed && (
        <div className="space-y-2 divide-y divide-border">
            <ParameterRow
              label="Риски"
              name="risks"
              value={parameters.risks}
              baseValue={BASE_PARAMETER_BENCHMARKS.risks}
              hours={overheadTotals.risks}
              comment={parameters.risksComment}
              commentName="risksComment"
              onChange={handleParameterChange}
            />
            <ParameterRow
              label="Управленческие расходы"
              name="management"
              value={parameters.management}
              baseValue={BASE_PARAMETER_BENCHMARKS.management}
              hours={overheadTotals.management}
              comment={parameters.managementComment}
              commentName="managementComment"
              onChange={handleParameterChange}
            />
            <div className="pt-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm text-muted-foreground">Тестирование</label>
                    <Switch 
                        id="manual-testing-switch"
                        checked={!!parameters.isManualTesting} 
                        onChange={(checked) => handleSwitchChange('isManualTesting', checked)}
                        label="ручной"
                    />
                </div>
                <div className="flex items-center justify-end space-x-2 mt-1">
                    {testingDeviation !== 0 && !parameters.isManualTesting ? (
                    <span className="text-sm font-bold text-destructive w-10 text-center">
                        {testingDeviation > 0 ? `+${testingDeviation.toFixed(0)}` : testingDeviation.toFixed(0)}%
                    </span>
                    ) : (
                        <div className="w-10" />
                    )}
                    <div className="w-12" />
                    <div className="flex items-center">
                    <input
                        type="number"
                        name="testing"
                        value={parameters.testing}
                        onChange={handleParameterChange}
                        disabled={parameters.isManualTesting}
                        className="w-20 bg-input text-foreground text-right rounded-md p-1 border border-border focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-secondary/50 disabled:cursor-not-allowed"
                    />
                    <span className="ml-2 w-[11px] text-muted-foreground">%</span>
                    </div>
                </div>
                {showTestingComment && (
                    <div className="mt-2">
                    <label htmlFor="testingComment" className="text-xs text-muted-foreground">Комментарий (обязательно)</label>
                    <textarea
                        id="testingComment"
                        name="testingComment"
                        value={parameters.testingComment || ''}
                        onChange={handleParameterChange}
                        className="w-full mt-1 bg-input text-foreground rounded-md p-2 border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                        rows={2}
                        placeholder={parameters.isManualTesting ? "Укажите причину перехода в ручной режим" : "Укажите причину отклонения от базового значения"}
                    />
                    </div>
                )}
            </div>
            <div className="pt-2">
                <ParameterRow
                  label="Общие расходы"
                  name="general"
                  value={parameters.general}
                  baseValue={BASE_PARAMETER_BENCHMARKS.general}
                  hours={overheadTotals.general}
                  comment={parameters.generalComment}
                  commentName="generalComment"
                  onChange={handleParameterChange}
                  isReadOnly
                />
                <div className="pl-4 mt-2 space-y-2 border-l-2 border-border">
                    <ParameterInput label="Отпуска" name="vacation" value={parameters.vacation} onChange={handleParameterChange} hours={overheadTotals.vacation} />
                    <ParameterInput label="Больничные" name="sick_leave" value={parameters.sick_leave} onChange={handleParameterChange} hours={overheadTotals.sick_leave} />
                    <ParameterInput label="Совещания" name="meetings" value={parameters.meetings} onChange={handleParameterChange} hours={overheadTotals.meetings} />
                    <ParameterInput label="Онбординг" name="onboarding" value={parameters.onboarding} onChange={handleParameterChange} hours={overheadTotals.onboarding} />
                </div>
            </div>
        </div>
        )}
      </div>
    </div>
  );
};
