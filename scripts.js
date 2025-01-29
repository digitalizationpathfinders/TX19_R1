
class Stepper {
    constructor(stepSelector) {
        this.steps = Array.from(document.querySelectorAll(stepSelector));
        this.activeStep = this.steps.find(step => step.classList.contains('active'));
        this.stepHandlers = {}; // Store step instances
    }

    // adjustMaxHeight(step) {
    //     const stepContent = step.querySelector('.step-content');
    //     if (stepContent) {
    //         stepContent.style.maxHeight = stepContent.scrollHeight + 'px';
    //     }
    // }

    // jumpStep(stepId) {
    //     this.setActive(this.steps.find(step => step.id === stepId));
    // }
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
        if (!stepForm) return;

        let dataObj = {};
        stepForm.querySelectorAll("input, select, textarea").forEach(input => {
            if (input.type === "radio" || input.type === "checkbox") {
                if (input.checked) {
                    dataObj[input.name] = input.value;
                }
            } else {
                dataObj[input.name] = input.value;
            }
        });

        DataManager.saveData(`stepData_${stepNum}`, dataObj);
    }

    loadStoredData() {
        this.steps.forEach((step, index) => {
            let savedData = DataManager.getData(`stepData_${index}`);
            if (!savedData) return;

            Object.keys(savedData).forEach(key => {
                let input = step.querySelector(`[name="${key}"]`);
                if (input) {
                    if (input.type === "radio" || input.type === "checkbox") {
                        if (input.value === savedData[key]) {
                            input.checked = true;
                        }
                    } else {
                        input.value = savedData[key];
                    }
                }
            });
        });
    }
    

    
    customStepCode(stepNum){
        if (!this.stepHandlers[stepNum]) {
            switch (stepNum) {
                case 3:
                    this.stepHandlers[stepNum] = new Step3Handler(); // Call step 3 logic
                    break;
                // Future steps can be added here
            }
        }
    }
}

class Step3Handler {
    constructor() {
        this.repPanelContainer = document.getElementById("legalrep-panel-container");
        this.warningAlert = document.getElementById("alert-norep");
        this.infoAlert = document.getElementById("alert-mailing");
        this.addRepButton = document.querySelector('[data-togglelb="addlegalrep-lightbox"]');

        this.userLevel = parseInt(DataManager.getData("userLevel")) || 2;
        this.legalRep = DataManager.getData("legalRepresentative") || null;
        this.mailRecipients = DataManager.getData("mailRecipients") || [];

        this.prepopulateForLevel3();
        this.updateRepresentativePanels();

        // Listen for lightbox submissions
        document.addEventListener("lightboxSubmitted", (event) => {
            if (event.detail.lightboxId === "addlegalrep-lightbox") {
                this.addMailRecipient(event.detail.formData);
            }
        });

        document.addEventListener("dataUpdated", (event) => {
            if (event.detail.key === "legalRepresentative" || event.detail.key === "mailRecipients") {
                this.legalRep = DataManager.getData("legalRepresentative");
                this.mailRecipients = DataManager.getData("mailRecipients") || [];
                this.updateRepresentativePanels();
            }
        });
    }

    prepopulateForLevel3() {
        if (this.userLevel === 3 && !this.legalRep) {
            //START HERE - formatting of the address with line breaks and the entered one does not include the mailing address and it also only accounts for level 3, not level 2
            const defaultRep = {
                name: "John Doe",
                role: "Executor",
                address: "123 Main Street Toronto, Ontario, A1A 1A1, Canada",
                phone: "(123) 456-7890",
                altPhone: "(098) 765-4321"
            };

            DataManager.saveData("legalRepresentative", defaultRep);
            this.legalRep = defaultRep;
        }
    }

    addMailRecipient(formData) {
        const newRecipient = {
            name: formData["s3-repname"] || "N/A",
            address: `${formData["s3-repcity"]}, ${formData["s3-reppostcode"]}, ${formData["s3-repcountry"]}`,
            phone: formData["s3-reptel1"] || "N/A",
            altPhone: formData["s3-reptel2"] || "N/A"
        };

        DataManager.appendToArray("mailRecipients", newRecipient);
    }

    updateRepresentativePanels() {
        this.repPanelContainer.innerHTML = "";

        if (this.legalRep) {
            this.warningAlert.classList.add("hidden");
            this.infoAlert.classList.remove("hidden");
            this.addRepButton.innerHTML = `<span class="material-icons">add</span> Add additional mail recipient`;

            this.createRepresentativePanel(this.legalRep, "Legal Representative");
        } else {
            this.warningAlert.classList.remove("hidden");
            this.infoAlert.classList.add("hidden");
            this.addRepButton.innerHTML = `<span class="material-icons">add</span> Add legal representative information`;
        }

        this.mailRecipients.forEach((recipient, index) => {
            this.createRepresentativePanel(recipient, `Mail Recipient ${index + 1}`);
        });
    }

    createRepresentativePanel(rep, title) {
        const panel = document.createElement("div");
        panel.classList.add("panel");

        panel.innerHTML = `
            <div class="heading-row">
                <h5>${title}</h5>
            </div>
            <table class="panel-data">
                <tr><td class="label">Name</td><td>${rep.name}</td></tr>
                <tr><td class="label">Mailing Address</td><td>${rep.address}</td></tr>
                <tr><td class="label">Primary Phone</td><td>${rep.phone}</td></tr>
                <tr><td class="label">Alternate Phone</td><td>${rep.altPhone}</td></tr>
            </table>
        `;

        this.repPanelContainer.appendChild(panel);
    }
}


class DataManager {
    static saveData(key, value) {
        sessionStorage.setItem(key, JSON.stringify(value));
        document.dispatchEvent(new CustomEvent("dataUpdated", { detail: { key, data: value } }));
    }
    static appendToArray(key, newValue) {
        let existingData = DataManager.getData(key) || [];
        if (!Array.isArray(existingData)) existingData = []; // Ensure it's an array
        existingData.push(newValue);
        DataManager.saveData(key, existingData);
    }

    static getData(key) {
        let data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    static clearData(key) {
        sessionStorage.removeItem(key);
    }
}


class DynamicTable {
    constructor(tableID){
        this.table = document.getElementById(tableID);
        this.tbody = this.table.querySelector('tbody');

        // Listen for data updates
        document.addEventListener('dataUpdated', (event) => {
            const { key, data } = event.detail;
            if (key.startsWith('formData_')) {
                this.populateTable(data);
            }
        });
    }
    populateTable(data) {
        this.tbody.innerHTML = ''; // Clear table

        if (Object.keys(data).length === 0) {
            this.tbody.innerHTML = `<td colspan="4" style="text-align:center;">No data available</td>`;
            return;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data.name || 'N/A'}</td>
            <td>${data.email || 'N/A'}</td>
            <td>${data.role || 'N/A'}</td>
            <td><button class="btn-tertiary">Edit</button></td>
        `;
        this.tbody.appendChild(row);
    }
}

class FormLightbox {
    constructor(lightbox){
        this.lightbox = lightbox;
        this.form = this.lightbox.querySelector('form');
        this.openTrigger = document.querySelector(`[data-togglelb="${lightbox.id}"]`);
        this.submitButton = this.lightbox.querySelector('[data-submit]');
       
        if(this.openTrigger){
            this.openTrigger.addEventListener('click', () => this.openLightbox());
            var buttonText = document.createTextNode(this.openTrigger.value);
            this.openTrigger.appendChild(buttonText)
        }
        this.initializeEventListeners();
    }
    initializeEventListeners() {
        this.lightbox.querySelectorAll('[data-closebtn]').forEach(btn => {
            btn.addEventListener('click', () => this.closeLightbox());
        });

        if (this.submitButton) {
            this.submitButton.addEventListener('click', (event) => {
                event.preventDefault();
                this.sendFormData();
                this.closeLightbox();
            });
        }
    }
    openLightbox() {
        this.lightbox.classList.add('open');
    }

    closeLightbox() {
        this.lightbox.classList.remove('open');
    }
    sendFormData() {
        const formData = new FormData(this.form);
        let dataObj = {};

        formData.forEach((value, key) => {
            dataObj[key] = value;
        });

        // Emit an event with the form data
        document.dispatchEvent(new CustomEvent("lightboxSubmitted", {
            detail: {
                lightboxId: this.lightbox.id,
                formData: dataObj
            }
        }));
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

    DataManager.saveData("userLevel", "3");


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
    //var dynamicTables = [];
    //document.querySelectorAll('.dynamic-table').forEach(table => { dynamicTables.push(new DynamicTable(table.id)) });

    document.querySelectorAll('.dynamic-table').forEach(table => { new DynamicTable(table.id) });
    document.querySelectorAll('.lightbox-container').forEach(lb => new FormLightbox(lb));


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







window.addEventListener('beforeunload', () => {
    sessionStorage.clear();
});