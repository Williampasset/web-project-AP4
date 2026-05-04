import { useState, type ReactNode, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import './Wizard.css';

export interface WizardStep {
  id: string;
  title: string;
  content: ReactNode;
  isValid?: boolean;
  onNext?: () => Promise<void> | void;
}

interface WizardProps {
  steps: WizardStep[];
  onComplete: () => Promise<void> | void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  showProgress?: boolean;
  allowSkip?: boolean;
}

export default function Wizard({
  steps,
  onComplete,
  onCancel,
  title,
  subtitle,
  showProgress = true,
}: WizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const isStepValid = step.isValid !== false;
  const isStepCompleted = completedSteps.includes(step.id);

  const progress = useMemo(() => {
    return ((currentStep + 1) / steps.length) * 100;
  }, [currentStep, steps.length]);

  const handleNext = async () => {
    if (!isStepValid) return;

    setIsLoading(true);
    try {
      if (step.onNext) {
        await step.onNext();
      }

      if (!isStepCompleted) {
        setCompletedSteps([...completedSteps, step.id]);
      }

      if (isLastStep) {
        await onComplete();
      } else {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Error in wizard step:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    if (index < currentStep || completedSteps.includes(steps[index].id)) {
      setCurrentStep(index);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className='wizard'>
      {/* Header */}
      {(title || subtitle) && (
        <div className='wizard__header'>
          {title && <h1 className='wizard__title'>{title}</h1>}
          {subtitle && <p className='wizard__subtitle'>{subtitle}</p>}
        </div>
      )}

      {/* Progress Bar */}
      {showProgress && (
        <div className='wizard__progress-container'>
          <div className='wizard__progress-bar'>
            <div
              className='wizard__progress-fill'
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className='wizard__progress-text'>
            Étape {currentStep + 1} sur {steps.length}
          </p>
        </div>
      )}

      {/* Steps Indicator */}
      <div className='wizard__steps-indicator'>
        {steps.map((s, index) => (
          <div
            key={s.id}
            className='wizard__step-item'
            onClick={() => handleStepClick(index)}
          >
            <div
              className={`wizard__step-dot ${
                index === currentStep ? 'wizard__step-dot--active' : ''
              } ${
                completedSteps.includes(s.id)
                  ? 'wizard__step-dot--completed'
                  : ''
              }`}
            >
              {completedSteps.includes(s.id) ? (
                <Check size={16} />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className='wizard__step-title'>{s.title}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className='wizard__content'>
        <div className='wizard__step-content'>{step.content}</div>
      </div>

      {/* Footer - Actions */}
      <div className='wizard__footer'>
        <div className='wizard__actions'>
          <button
            onClick={handleCancel}
            className='wizard__button wizard__button--secondary'
            type='button'
          >
            Annuler
          </button>

          <div className='wizard__nav-buttons'>
            <button
              onClick={handlePrevious}
              disabled={isFirstStep || isLoading}
              className='wizard__button wizard__button--outline'
              type='button'
              title='Étape précédente'
            >
              <ChevronLeft size={18} />
              Précédent
            </button>

            <button
              onClick={handleNext}
              disabled={!isStepValid || isLoading}
              className='wizard__button wizard__button--primary'
              type='button'
              title={isLastStep ? 'Terminer' : 'Étape suivante'}
            >
              {isLoading ? (
                <>
                  <span className='wizard__spinner' />
                  Traitement...
                </>
              ) : (
                <>
                  {isLastStep ? 'Terminer' : 'Suivant'}
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
