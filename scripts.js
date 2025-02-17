class Stepper {
    constructor(stepSelector) {
        this.steps = Array.from(document.querySelectorAll(stepSelector));
        this.activeStep = this.steps.find(step => step.classList.contains('active'));
        this.observeStepContentChanges(); 

        this.stepHandlers = {}; // Store step instances
        this.customStepCode(this.steps.indexOf(this.activeStep))
    }

    adjustMaxHeight(step) {
        if (!step) return;
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

    observeStepContentChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === "childList") {
                    this.adjustMaxHeight(this.activeStep); // ✅ Auto-adjust height when new elements are added
                }
            });
        });

        this.steps.forEach(step => {
            const stepContent = step.querySelector('.step-content');
            if (stepContent) {
                observer.observe(stepContent, { childList: true, subtree: true });
            }
        });
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
                case 2:
                    this.stepHandlers[stepNum] = new Step2Handler(); 
                    break;
                case 3:
                    this.stepHandlers[stepNum] = new Step3Handler(); 
                    break;
                case 5:
                    this.stepHandlers[stepNum] = new Step5Handler();
                    break;
            }
        }
    }
}

class Step2Handler {
    constructor(){
        this.deceasedtpPanelContainer = document.getElementById("deceasedinfo-panel-container");
        this.populateDeceasedPanel();
        
    }
    populateDeceasedPanel(){
        console.log(this.deceasedtpPanelContainer);

        this.deceasedtpPanelContainer.innerHTML = "";
        // this.deceasedtpPanelContainer.innerHTML = `
        //     <div class="heading-row">
        //         <h5>Deceased individual's information on file</h5>
        //     </div>
        //     <table class="panel-data">
        //         <tr><td class="label">Name of deceased</td><td>--</td></tr>
        //         <tr><td class="label">Social Insurance Number</td><td>--</td></tr>
        //         <tr><td class="label">Date of death</td><td>--</td></tr>
        //     </table>
        // `;

    }
    

}

class Step3Handler {
    constructor() {
        this.userLevel = parseInt(DataManager.getData("userLevel")) || 2;
        this.legalRep = DataManager.getData("legalRepresentative") || null;


        // if(this.userLevel === 3 && !this.legalRep) {
        //     this.prepopulateForLevel3();
        // }
        this.addRepLightbox = new FormLightbox(document.getElementById("addlegalrep-lightbox"));

        this.repPanelContainer = document.getElementById("legalrep-panel-container");
        this.mailRecipContainer = document.getElementById("mailrecip-container");
        this.legalRepInfoFieldset = document.querySelector("#legalrepinfo-fieldset");
        this.warningAlert = document.getElementById("alert-norep");
        this.infoAlert = document.getElementById("alert-mailing");
        this.lightboxHeader = document.querySelector('#addlegalrep-lightbox .header h3');
        this.lightboxButton = document.querySelector('#addlegalrep-lightbox [data-submit]');
        this.addRepButton = document.querySelector('[data-togglelb="addlegalrep-lightbox"]');

        this.mailRecipients = DataManager.getData("mailRecipients") || [];

        this.updateRepresentativePanels();

        // Listen for lightbox submissions
        document.addEventListener("lightboxSubmitted", (event) => {
            if (event.detail.lightboxId === "addlegalrep-lightbox") {
                this.handleFormSubmit(event.detail.formData);
            }
        });

        // Listen for data updates (to react to storage changes)
        document.addEventListener("dataUpdated", (event) => {
            if (event.detail.key === "legalRepresentative" || event.detail.key === "mailRecipients") {
                this.legalRep = DataManager.getData("legalRepresentative");
                this.mailRecipients = DataManager.getData("mailRecipients") || [];
                this.updateRepresentativePanels();
            }
        });
    }

    handleFormSubmit(formData) {
        const editIndex = this.addRepLightbox.getEditIndex();

        let address = " ";
        if (formData["s3-country"] === "Canada") {
            address = `${formData["s3-caddress"]}<br>${formData["s3-repcity"]}, ${formData["s3-repprov"]} ${formData["s3-reppostcode"]}<br>Canada`;
        } else if (formData["s3-country"] === "Outside of Canada") {
            address = `${formData["s3-iaddress"]}`;
        }

        const newRepresentative = {
            name: formData["s3-repname"] || " ",
            role: formData["s3-reprole"] || " ",
            address: address,
            phone: formData["s3-reptel1"] || " ",
            altPhone: formData["s3-reptel2"] || " "
        };

        if (!this.legalRep) {
            // If no legal rep is set, this is the legal representative
            DataManager.saveData("legalRepresentative", newRepresentative);
        } else {
            // Otherwise, it's an additional mail recipient
            this.mailRecipients.push(newRepresentative);
            DataManager.saveData("mailRecipients", this.mailRecipients);
        }

        this.updateRepresentativePanels();
    }

    updateRepresentativePanels() {
        this.repPanelContainer.innerHTML = "";
        this.mailRecipContainer.innerHTML = ""; 
       
        if (this.legalRep) {
            // State 3: Level 3 User (Legal Rep on File) - Show Name & Address only, but keep fieldset visible
            if (this.userLevel === 3) {
                this.warningAlert.classList.add("hidden");
                this.infoAlert.classList.remove("hidden");
                this.legalRepInfoFieldset.classList.remove("hidden"); // Show fieldset for phone + role collection
                this.addRepButton.innerHTML = `<span class="material-icons">add</span> Add additional mail recipient`;
                this.createRepresentativePanel(this.legalRep, "Legal Representative", true, false); // Show name & address only
            } 
            // State 2: Level 2 User (Legal Rep Just Added) - Show all fields, hide fieldset
            else {
                this.warningAlert.classList.add("hidden");
                this.infoAlert.classList.remove("hidden");
                this.legalRepInfoFieldset.classList.add("hidden"); // Hide fieldset
                this.addRepButton.innerHTML = `<span class="material-icons">add</span> Add additional mail recipient`;
                this.createRepresentativePanel(this.legalRep, "Legal Representative", true, true); // Show all data
            }
        } else {
            // State 1: No Legal Rep - Show warning, hide info banner, set button for adding legal rep
            this.warningAlert.classList.remove("hidden");
            this.infoAlert.classList.add("hidden");
            this.legalRepInfoFieldset.classList.add("hidden");
            this.addRepButton.innerHTML = `<span class="material-icons">add</span> Add legal representative information`;
        }

        this.mailRecipients.forEach((recipient, index) => {
            this.createRepresentativePanel(recipient, `Mail Recipient ${index + 1}`);
        });

     
    }

    createRepresentativePanel(rep, title, isLegalRep = false, showFullDetails = true) {
        const panel = document.createElement("div");
        panel.classList.add("panel");
    
        // Show Name & Address only (Level 3) OR Show all fields (Level 2)
        panel.innerHTML = `
            <div class="heading-row">
                <h5>${title}</h5>
            </div>
            <table class="panel-data">
                <tr><td class="label">Name</td><td>${rep.name}</td></tr>
                <tr><td class="label">Mailing Address</td><td>${rep.address}</td></tr>
                ${showFullDetails ? `
                <tr><td class="label">Primary Phone</td><td>${rep.phone}</td></tr>
                <tr><td class="label">Alternate Phone</td><td>${rep.altPhone}</td></tr>
                <tr><td class="label">Role</td><td>${rep.role}</td></tr>` : ""}
            </table>
        `;

        if (isLegalRep) {
            this.repPanelContainer.appendChild(panel);
        } else {
            this.mailRecipContainer.appendChild(panel);
        }
    }
}

class Step5Handler {
    constructor() {
        this.tempData = null; // Temporary storage for lightbox data
        this.documentsTable = new TableObj("tb-upload-doc");
        this.uploadDocLightbox = new FormLightbox(document.getElementById("uploaddoc-lightbox"));

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
       
        // Set the index of the row being edited
        this.uploadDocLightbox.setEditIndex(index);

        // Fill form with existing row data
        this.uploadDocLightbox.populateForm(rowData);
         // Manually update filename span
        if (rowData["s5-filename"]) {
            const filenameDisplay = document.getElementById("s5-filename-display");
        if (filenameDisplay) {
            filenameDisplay.textContent = rowData["s5-filename"];
        }
    }

        // Open the lightbox
        this.uploadDocLightbox.openLightbox();
    }

    handleFormSubmit(formData) {
    
        const editIndex = this.uploadDocLightbox.getEditIndex();
    
        if (editIndex !== null && editIndex !== undefined && editIndex !== "") {
            this.documentsTable.rows[editIndex] = formData;
            this.uploadDocLightbox.clearEditIndex();
            this.documentsTable.refreshTable();
        } else {
            this.documentsTable.addRow(formData);
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

    emitEditEvent(index) {
        index = parseInt(index);
        if (!this.rows[index]) return;

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
        this.tbody.innerHTML = ""; // Clear the table
    
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
        this.editIndex = null;
       
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
        this.clearEditIndex();
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
    populateForm(data) {
        if (!this.form) return;
        Object.keys(data).forEach((key) => {
            const input = this.form.querySelector(`[name="${key}"]`);
            if (input) input.value = data[key];
        });
    }

    sendFormData() {
        const formData = new FormData(this.form);
        let dataObj = {};
    
        formData.forEach((value, key) => {
            dataObj[key] = value;
        });
        
        document.dispatchEvent(new CustomEvent("lightboxSubmitted", {
            detail: {
                lightboxId: this.lightbox.id,
                formData: dataObj
            }
        }));
    
        this.closeLightbox();
    }
    
    setEditIndex(index) {
        this.editIndex = index;
    }

    getEditIndex() {
        return this.editIndex;
    }
    clearEditIndex() {
        this.editIndex = null;
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

    let taskData = sessionStorage.getItem("selectedTask");

    if (!taskData) {
        // If user somehow lands here without choosing a task, redirect them back
        window.location.href = "chooser.html";
    } else {
        taskData = JSON.parse(taskData);
        console.log("Loaded Task Data:", taskData);

        // Store data for use in other scripts
        DataManager.saveData("deceasedInfo", taskData.deceasedInfo);
        DataManager.saveData("userLevel", taskData.userLevel);

        if (taskData.legalRepresentative) {
            DataManager.saveData("legalRepresentative", taskData.legalRepresentative);
        }
    }

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
    //document.querySelectorAll('.lightbox-container').forEach(lb => new FormLightbox(lb));


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