class Stepper {
    constructor(stepSelector) {
        this.steps = Array.from(document.querySelectorAll(stepSelector));
        this.activeStep = this.steps.find(step => step.classList.contains('active'));
    }

    adjustMaxHeight(step) {
        const stepContent = step.querySelector('.step-content');
        if (stepContent) {
            stepContent.style.maxHeight = stepContent.scrollHeight + 'px';
        }
    }

    jumpStep(stepId) {
        this.setActive(this.steps.find(step => step.id === stepId));
    }

    navigateStep(direction) {
        const currentIndex = this.steps.indexOf(this.activeStep);
        const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

        if (targetIndex >= 0 && targetIndex < this.steps.length) {
            this.setActive(this.steps[targetIndex]);
        }
    }

    setActive(step) {
        if (!step) return;

        if (this.activeStep) {
            this.activeStep.classList.remove('active');
            const stepContent = this.activeStep.querySelector('.step-content');
            if (stepContent) stepContent.style.maxHeight = null;
        }

        step.classList.add('active');
        this.activeStep = step;

        this.adjustMaxHeight(step);
    }
}

class ProgressiveDisclosure {
    constructor(stepperInstance = null) {
        this.stepper = stepperInstance; // Optionally pass the stepper instance
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Attach change event to all elements with the `data-toggle` attribute
        document.querySelectorAll('[data-toggle], input[type="radio"]').forEach(input => {
            input.addEventListener('change', this.handleToggle.bind(this));
        });
    }

    handleToggle(event) {
        const input = event.target;
        const toggleTargets = input.getAttribute('data-toggle');

        // Hide all sibling toggle targets in the same group
        this.hideOtherTargets(input);

        // If the current input has a data-toggle, handle its targets
        if (toggleTargets) {
            const targetIds = toggleTargets.split(',').map(id => id.trim());
            targetIds.forEach(targetId => {
                const targetElement = document.getElementById(targetId);
                if (!targetElement) {
                    console.error(`Element with ID '${targetId}' not found.`);
                    return;
                }

                if (input.checked) {
                    targetElement.classList.remove('hidden');
                }
            });
        }

        // Adjust stepper height if available
        if (this.stepper) {
            const currStep = this.stepper.activeStep;
            this.stepper.adjustMaxHeight(currStep);
        }
    }

    hideOtherTargets(input) {
        const groupName = input.name;
    
        if (groupName) {
            // Get all inputs in the same group with the same name
            const groupInputs = document.querySelectorAll(`input[name="${groupName}"]`);
    
            groupInputs.forEach(groupInput => {
                const otherTargets = groupInput.getAttribute('data-toggle');
                if (otherTargets) {
                    const targetIds = otherTargets.split(',').map(id => id.trim());
                    targetIds.forEach(targetId => {
                        const targetElement = document.getElementById(targetId);
                        if (targetElement) {
                            // Hide the element
                            targetElement.classList.add('hidden');
    
                            // Clear all input fields inside the hidden target
                            const inputs = targetElement.querySelectorAll('input, select, textarea');
                            inputs.forEach(input => {
                                if (input.type === 'radio' || input.type === 'checkbox') {
                                    input.checked = false;
                                } else {
                                    input.value = '';
                                }
                            });
    
                            // Recursively clear any nested data toggles
                            const nestedToggles = targetElement.querySelectorAll('[data-toggle]');
                            nestedToggles.forEach(nestedToggle => {
                                const nestedTargets = nestedToggle.getAttribute('data-toggle');
                                if (nestedTargets) {
                                    nestedTargets.split(',').forEach(nestedTargetId => {
                                        const nestedTargetElement = document.getElementById(nestedTargetId.trim());
                                        if (nestedTargetElement) {
                                            nestedTargetElement.classList.add('hidden');
                                            const nestedInputs = nestedTargetElement.querySelectorAll('input, select, textarea');
                                            nestedInputs.forEach(nestedInput => {
                                                if (nestedInput.type === 'radio' || nestedInput.type === 'checkbox') {
                                                    nestedInput.checked = false;
                                                } else {
                                                    nestedInput.value = '';
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    }
    
}





document.addEventListener('DOMContentLoaded', () => {
    // Initialize Stepper
    const stepper = new Stepper('.step');

    // Initialize ProgressiveDisclosure and pass the stepper instance
    new ProgressiveDisclosure(stepper);

    // Load the last step from session storage
    const savedStepId = sessionStorage.getItem('currentStep');
    if (savedStepId) {
        stepper.jumpStep(savedStepId);
    }


    // Add event listeners to all next buttons
    document.querySelector('.stepper').addEventListener('click', (event) => {
        if (event.target.classList.contains('next-button')) {
            stepper.navigateStep('next');
         
        } else if (event.target.classList.contains('back-button')) {
            stepper.navigateStep('back');
        
        }
    });

    // Find all radio inputs
    const radioInputs = document.querySelectorAll('input[type="radio"]');

    // Iterate over each radio input
    radioInputs.forEach(radio => {
        // Get the associated label using the 'for' attribute
        const label = document.querySelector(`label[for="${radio.id}"]`);

        if (label) {
            // Populate the label content with the radio's value
            label.textContent = radio.value;
        }
    });

    

});



function toggleLB(lightboxID) {

    document.getElementById('#' + lightboxID).classList.toggle('open');

}

