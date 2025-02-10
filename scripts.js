
class Stepper {
    constructor(stepSelector) {
        this.steps = Array.from(document.querySelectorAll(stepSelector));
        this.activeStep = this.steps.find(step => step.classList.contains('active'));
        
        this.stepHandlers = {}; // Store step instances
        this.customStepCode(this.steps.indexOf(this.activeStep))
    }

    adjustMaxHeight(step) {
        const stepContent = step.querySelector('.step-content');
        if (stepContent) {
            stepContent.style.maxHeight = stepContent.scrollHeight + 'px';
        }
    }

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
                case 5:
                    this.stepHandlers[stepNum] = new Step5Handler();
                    break;
            }
        }
    }
}

class Step3Handler {
    constructor() {
        this.repPanelContainer = document.getElementById("legalrep-panel-container");
        this.warningAlert = document.getElementById("alert-norep");
        this.infoAlert = document.getElementById("alert-mailing");
        this.lightboxHeader = document.querySelector('#addlegalrep-lightbox .header h3');
        this.lightboxButton = document.querySelector('#addlegalrep-lightbox [data-submit]');
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
                address: "123 Main Street<br>Toronto, Ontario A1A 1A1<br>Canada",
                phone: "(123) 456-7890",
                altPhone: "(098) 765-4321"
            };

            DataManager.saveData("legalRepresentative", defaultRep);
            this.legalRep = defaultRep;
        }
    }

    addMailRecipient(formData) {
        let address = " ";

        // Determine the correct address fields based on selected country
        if (formData["s3-country"] === "Canada") {
            address = `${formData["s3-caddress"]}<br>${formData["s3-repcity"]}, ${formData["s3-repprov"]} ${formData["s3-reppostcode"]}<br>Canada`;
        } else if (formData["s3-country"] === "Outside of Canada") {
            address = `${formData["s3-iaddress"]}`;
        }


        const newRecipient = {
            name: formData["s3-repname"] || " ",
            role: formData["s3-reprole"] || " ",
            address: address,
            phone: formData["s3-reptel1"] || " ",
            altPhone: formData["s3-reptel2"] || " "
        };

        DataManager.appendToArray("mailRecipients", newRecipient);
    }

    updateRepresentativePanels() {
        this.repPanelContainer.innerHTML = "";
       
        if (this.legalRep) {
            this.warningAlert.classList.add("hidden");
            this.infoAlert.classList.remove("hidden");
            this.addRepButton.innerHTML = `<span class="material-icons">add</span> Add additional mail recipient`;
            this.lightboxHeader.textContent = "Add additional mail recipient"

            this.createRepresentativePanel(this.legalRep, "Legal Representative");
        } else {
            this.warningAlert.classList.remove("hidden");
            this.infoAlert.classList.add("hidden");
            this.addRepButton.innerHTML = `<span class="material-icons">add</span> Add legal representative information`;
             this.lightboxHeader.textContent = "Add legal representative information"
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

class Step5Handler {
    constructor() {
        this.tempData = null; // Temporary storage for lightbox data
        this.documentsTable = new TableObj("tb-upload-doc");

        this.browseFileButton = document.getElementById("s5-browsebtn");
        this.fileNameDisplay = document.getElementById("s5-filename-display");
        this.hiddenFileInput = document.getElementById("s5-filename");
        this.hiddenFileSize = document.getElementById("s5-size");

        if(!this.browseFileButton) return;

        this.fakeFileNames = [
            "Contract_Agreement.pdf",
            "Estate_Document.docx",
            "Final_Tax_return.xlsx",
            "LegalDeclaration.pdf"
        ];

        this.browseFileButton.addEventListener("click", () => this.selectFile());

        document.addEventListener("lightboxSubmitted", (event) => {
            if (event.detail.lightboxId === "uploaddoc-lightbox") {
                this.handleFormSubmit(event.detail.formData);
            }
        });
        // Listen for edit events
        document.addEventListener("editRowEvent", (event) => {
            if (event.detail.tableID === "tb-upload-doc") {
                this.openEditLightbox(event.detail.index, event.detail.rowData);
            }
        });
    }
    selectFile(){
        this.selectedFileName = this.fakeFileNames[Math.floor(Math.random() * this.fakeFileNames.length)];

        this.fileNameDisplay.textContent = this.selectedFileName;
        this.hiddenFileInput.value = this.selectedFileName;

        const fakeSize = Math.floor(Math.random() * 450) + 50 + " KB";
        this.hiddenFileSize.value = fakeSize;
    }

    openEditLightbox(index, rowData) {
        const lightbox = document.getElementById("uploaddoc-lightbox");
        if (!lightbox) return;

        // Store the row index in the lightbox for reference
        lightbox.dataset.editIndex = index;

        // Fill the form fields with existing row data
        const form = lightbox.querySelector("form");
        if (!form) return;

        Object.keys(rowData).forEach((key) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = rowData[key];
        });

        //heres where it needs to call the lightbox's "open" function, maybe needto make reference to the lightbox OBJ itself rather than the HTML element
    }

    handleFormSubmit(formData) {
        const lightbox = document.getElementById("uploaddoc-lightbox");
        if (!lightbox) return;

        const editIndex = lightbox.dataset.editIndex;

        if (editIndex !== undefined) {
            this.documentsTable.rows[editIndex] = formData; // Update existing row
            lightbox.dataset.editIndex = ""; // Clear edit index
            this.documentsTable.refreshTable(); // Refresh table to reflect changes
        } else {
            this.documentsTable.addRow(formData); // Add new row
        }
    }
}

class TableObj {
    constructor (tableID) {
        this.table = document.getElementById(tableID);
        this.tbody = this.table.querySelector("tbody");
        this.defaultText = this.tbody.dataset.placeholder;
        this.columnCount = this.table.querySelector("thead tr").children.length;
        this.rows = []; // Store data for easier access

       // Initialize the table with placeholder text if empty
       this.renderEmptyTable();
    }
    renderEmptyTable() {
        this.tbody.innerHTML = `<tr><td colspan="${this.columnCount + 1}" style="text-align:center;">${this.defaultText}</td></tr>`;
    }
    addRow(data) {
        // If the table is displaying the default placeholder row, clear it
        if (this.tbody.querySelector("tr") && this.tbody.querySelector("tr").cells.length === 1) {
            this.tbody.innerHTML = "";
        }
        const rowIndex = this.rows.length; // Get index for reference
        this.rows.push(data); // Store the row data for editing

        // Create a new row
        const tr = document.createElement("tr");

        // Populate row with data
        Object.values(data).forEach((value) => {
            const td = document.createElement("td");
            td.textContent = value || "N/A"; // Handle empty fields
            tr.appendChild(td);
        });

        // Actions column (placeholder for buttons)
        const actionTd = document.createElement("td");
        actionTd.innerHTML = `
            <button type="button" class="btn-tertiary edit-btn" data-index="${rowIndex}"><span class="material-icons">edit</span>Edit</button>
            <button type="button" class="btn-tertiary delete-btn" data-index="${rowIndex}"><span class="material-icons">close</span>Delete</button>
        `;
        tr.appendChild(actionTd);

        // Append row to table
        this.tbody.appendChild(tr);

        // Attach event listeners
        actionTd.querySelector(".edit-btn").addEventListener("click", (event) => {
            this.emitEditEvent(event.target.closest(".edit-btn").dataset.index);
        });

        actionTd.querySelector(".delete-btn").addEventListener("click", (event) => {
            this.deleteRow(event.target.closest(".delete-btn").dataset.index);
        });

    }

    emitEditEow(index) {
        index = parseInt(index);
        if (!this.rows[index]) return;

        console.log(`Emitting event to edit row ${index}`, this.rows[index]);

        // Dispatch an event so Step5Handler (or other handlers) can respond
        document.dispatchEvent(new CustomEvent("editRowEvent", {
            detail: {
                tableID: this.table.id,
                index: index,
                rowData: this.rows[index]
            }
        }));
    }
    deleteRow(index) {
        index = parseInt(index);
        this.rows.splice(index, 1);
        this.refreshTable();
    }

    refreshTable() {
        this.tbody.innerHTML = "";
        if (this.rows.length === 0) {
            this.renderEmptyTable();
            return;
        }
        this.rows.forEach((rowData, index) => {
            this.addRow(rowData);
        });
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


class FormLightbox {
    constructor(lightbox){
        this.lightbox = lightbox;
        this.form = this.lightbox.querySelector('form');
        this.openTrigger = document.querySelector(`[data-togglelb="${lightbox.id}"]`);
        this.submitButton = this.lightbox.querySelector('[data-submit]');
       
        if(this.openTrigger){
            this.openTrigger.addEventListener('click', () => {
                this.openLightbox();
                this.clearFormData();
            });
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
                
            });
        }
    }
    openLightbox() {
        this.lightbox.classList.add('open');
    }

    closeLightbox() {
        this.lightbox.classList.remove('open');
    }

    clearFormData() {
        if (!this.form) return;
        this.form.querySelectorAll("input, select, textarea").forEach(input => {
            if (input.type === "checkbox" || input.type === "radio") {
                input.checked = false;
            } else {
                input.value = "";
            }
        });
        // Reset spans with data-formelement
        this.form.querySelectorAll("[data-formelement]").forEach(span => {
        span.textContent = span.dataset.placeholder || "";
        });
    }


    sendFormData(){
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
    
        this.closeLightbox();
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
  
    //document.querySelectorAll('.dynamic-table').forEach(table => { new DynamicTable(table.id) });
    document.querySelectorAll('.lightbox-container').forEach(lb => new FormLightbox(lb));


    //Accordion functionality
    const accordions = document.querySelectorAll('.accordion');
    accordions.forEach(accordion => {
        accordion.addEventListener('click', function() {
            this.classList.toggle('active');
            const accordionContent = this.nextElementSibling;

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