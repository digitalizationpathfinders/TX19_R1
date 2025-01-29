var level = 2;

class Stepper {
    constructor(stepSelector) {
        this.steps = Array.from(document.querySelectorAll(stepSelector));
        this.activeStep = this.steps.find(step => step.classList.contains('active'));
        this.authenticationLevel(level);
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
           this.storeData(currentIndex);
            this.setActive(this.steps[targetIndex]);
        }
    }

    storeData(stepNum) {
        const stepForm = document.querySelector(`#step-${stepNum}-form`);
        if(stepForm){
            const stepData = stepForm.querySelectorAll('input:checked, input[type=textbox]');
            console.log(stepData);
        }
       
    }

    setActive(step) {
        if (!step) return;

        if (this.activeStep) {
            
            this.activeStep.classList.remove('active');
            const stepContent = this.activeStep.querySelector('.step-content');
            if (stepContent) {
                stepContent.style.maxHeight = null;
            }
        }

        step.classList.add('active');
        this.activeStep = step;

        this.customStepCode(this.steps.indexOf(this.activeStep))

        //this.adjustMaxHeight(step); //hiding this fixed the accordion issue, unknown other effects/imapcts though
    }

    authenticationLevel(level){
        const level2Content = document.querySelectorAll('.level2');
        const level3Content = document.querySelectorAll('.level3');
        if(level == 2) {
          
            level2Content.forEach(el => {
                el.classList.remove('hidden');
            })
            level3Content.forEach(el => {
                el.classList.add('hidden');
            })
        }
        else {
            level2Content.forEach(el => {
                el.classList.add('hidden');
            })
            level3Content.forEach(el => {
                el.classList.remove('hidden');
            })
        }
    }

    customStepCode(stepNum){

        switch(stepNum){
            case 1:
                break;
            case 2:
                break;
            case 3:
                var haveLegalRepInfo = false;
                if(level == 3) 
                    haveLegalRepInfo = true;

                if(haveLegalRepInfo){

                }

                break;
            case 5:
                //check if there are docs, populate table with docs if so, if not, fill with 
        }

    }
}

class DynamicTable {
    constructor(tableID){
        this.table = document.getElementById(tableID);
        this.populateDefault();
    }
    populateDefault(){
        var tbody = this.table.querySelector('tbody');
        var placeholdertext = tbody.dataset.placeholder;
        tbody.innerHTML = `<td colspan="4" style="text-align:center;">${placeholdertext}</td>`;
    }
}

class FormLightbox {
    constructor(lightboxID, triggerID){
        this.lightbox = document.getElementById(lightboxID);
        this.initializeEventListeners();
        this.openTrigger = document.getElementById(triggerID);
    }
    initializeEventListeners() {
        // Attach click event to buttons with the `data-togglelb` attribute
        this.openTrigger.addEventListener('click', this.lightbox.classList.add('open'));
        document.querySelectorAll('[data-closebtn]').forEach(btn => {
            btn.addEventListener('click', this.lightbox.classList.remove('open'));
        });

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

    // Populate radio button labels with their 'value'
    const inputsWithLabels = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    inputsWithLabels.forEach(input => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) {
            label.textContent = input.value;
        }
    });

    //Initialize buttons that toggle lightbox
    const lightboxTriggerButtons = document.querySelectorAll('.lightbox-trigger');
    lightboxTriggerButtons.forEach(button => {
        var buttonText = document.createTextNode(button.value);
        button.appendChild(buttonText)
    });

    //Add asterisks to all required fields
    const requiredInputs = document.querySelectorAll('.required-label');
    requiredInputs.forEach(input => {
    if (input) {
        const asterisk = document.createElement('span');
        asterisk.textContent = '* ';
        asterisk.classList.add('label-ast');

        input.insertBefore(asterisk, input.firstChild);
    }
    });
    var dynamicTables = [];

    document.querySelectorAll('.dynamic-table').forEach(table => { dynamicTables.push(new DynamicTable(table.id)) });



    // const dynamicTable = new DynamicTable('tb-upload-doc', 'lightbox-id');
    // dynamicTable.initializeLightboxInputs({
    //     fileName: document.getElementById('input-file-name'),
    //     description: document.getElementById('input-description'),
    //     fileSize: document.getElementById('input-file-size')
    // });

    // document.getElementById('add-row-button').addEventListener('click', () => {
    //     dynamicTable.openLightbox();
    // });


    //Accordion functionality
    const accordions = document.querySelectorAll('.accordion');
    accordions.forEach(accordion => {
        accordion.addEventListener('click', function() {
            this.classList.toggle('active');
            const accordionContent = this.nextElementSibling;
            console.log(this.nextElementSibling)

            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + 'px';
            }
        });
    });
    
});







