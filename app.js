const WEATHER = {
    "cold": 1,
    "neutral": 2,
    "warm": 3,
    "hot": 4
}

const ITEM_TYPES = {
    'top': 1,
    'sweater': 2,
    'cardigan': 3,
    'skirt': 4,
    'dress': 5,
    'pants': 6,
    'socks': 7,
    'accessory': 8,
    'outerwear': 9,
    'shoes': 10
}

const ITEM_COLORS = {
    "pink": {
        "light": "rgb(233, 154, 200)",
        "dark": "rgb(177, 62, 129)",
    },
    "white": {
        "light": "rgb(221, 221, 221)",
        "dark": "rgb(58, 58, 58)"
    },
    "blue": {
        "light": "rgb(194, 205, 255)",
        "dark": "rgb(49, 71, 145)"
    },
    "purple": {
        "light": "rgb(228, 194, 255)",
        "dark": "rgb(125, 71, 168)",
    },
    "red": {
        "light": "rgb(206, 126, 143)",
        "dark": "rgb(143, 38, 65)"
    },
    "burgundy": {
        "light": "rgb(206, 126, 143)",
        "dark": "rgb(143, 38, 65)"
    },
    "black": {
        "light": "rgb(94, 94, 94)",
        "dark": "rgb(0, 0, 0)"
    },
    "cream": {
        "light": "rgb(235, 204, 190)",
        "dark": "rgb(129, 66, 37)"
    },
    "beige": {
        "light": "rgb(248, 225, 214)",
        "dark": "rgb(129, 66, 37)"
    },
    "pearl": {
        "light": "rgb(221, 221, 221)",
        "dark": "rgb(58, 58, 58)"
    },
}

const STAR_UNICODE = '\u2605'

var outfits = []
var items = []

class Item {
    constructor(name, type, wishlist=false, worn=false) {
        this.name = name;
        this.type = type;
        this.wishlist = wishlist;
        this.worn = worn;
        this.outfits = []
    }
}

class Outfit {
    constructor(items, weather, stars) {
        this.items = items;
        this.weather = weather;
        this.stars = stars;
    }

    isAvailable() {
        for (const item of this.items) {
            if (item.worn) {
                return false;
            }
        }
        return true;
    }

    isWishlist() {
        for (const item of this.items) {
            if (item.wishlist) {
                return true;
            }
        }
        return false;
    }
}



function getItemByName(name) {
    for (const item of items) {
        if (name == item.name)
            return item
    }
}


function saveData(i=items, o=outfits) {
    localStorage.setItem("items", JSON.stringify(i, null, 2))
    localStorage.setItem("outfits", JSON.stringify(o, null, 2))
}


function getSavedData() {
    jsonItems = localStorage.getItem("items");
    parsedItems = JSON.parse(jsonItems) || []
    items = parsedItems.map(item => new Item(item.name, item.type, item.wishlist, item.worn))

    jsonOutfits = localStorage.getItem("outfits");
    parsedOutfits = JSON.parse(jsonOutfits) || []

    for (outfit of parsedOutfits) {
        const outfitItems = outfit.items.map(item => getItemByName(item.name))
        outfits.push(new Outfit(outfitItems, outfit.weather, parseInt(outfit.stars, 10)))
    }
}


function showItems() {
    const componentsDiv = document.getElementById('components-list')
    componentsDiv.replaceChildren()

    filteredItems = items;

    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    if (name) {
        filteredItems = filteredItems.filter(item => item.name.includes(name))
    }
    const types = urlParams.getAll('type');
    if (types.length > 0) {
        filteredItems = filteredItems.filter(item => types.includes(item.type))
    }
    const wishlist = urlParams.get('wishlist');
    if (wishlist != null) {
        filteredItems = filteredItems.filter(item => item.wishlist == wishlist)
    }
    const worn = urlParams.get('worn');
    if (worn != null) {
        filteredItems = filteredItems.filter(item => item.worn == worn)
    }

    const sortby = urlParams.get('sortby')
    if (sortby != null) {
        filteredItems = [...filteredItems].sort((a, b) => {
            const aVal = a[sortby];
            const bVal = b[sortby];

            if (sortby == 'type') {
                return ITEM_TYPES[aVal] - ITEM_TYPES[bVal];
            }
        
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return aVal.localeCompare(bVal);
            }       
            return aVal - bVal;
        })
    }

    for (const item of filteredItems) {
        componentsDiv.appendChild(new ItemComponent(item));
    }
}



function showOutfits(filter={}) {
    const componentsDiv = document.getElementById('components-list')
    componentsDiv.replaceChildren()
    
    filteredOutfits = outfits;
    if (filter && Object.keys(filter).length != 0) {
        if (filter?.['items'] && filter['items'].length > 0) {
            filteredOutfits = filteredOutfits.filter(outfit => 
                filter['items'].some(itemName => outfit.items.map(item => item.name).includes(itemName)))
        }
        if (filter?.['weather'] && filter['weather'].length > 0) {
            filteredOutfits = filteredOutfits.filter(outfit => filter['weather'].includes(outfit.weather))
        }
        if (filter?.['stars'] && filter['stars'].length > 0) {
            filteredOutfits = filteredOutfits.filter(outfit => filter['stars'].includes(outfit.stars))
        }
        if (Object.keys(filter).includes('available') && 
                filter['available'] != TriStateCheckbox.state.NEUTRAL) {
            filteredOutfits = filteredOutfits.filter(outfit => outfit.isAvailable() == filter['available'])
        }
        if (Object.keys(filter).includes('wishlist') && 
                filter['wishlist'] != TriStateCheckbox.state.NEUTRAL) {
            filteredOutfits = filteredOutfits.filter(outfit => outfit.isWishlist() == filter['wishlist'])
        }
    }

    for (const outfit of filteredOutfits) {
        componentsDiv.appendChild(new OutfitComponent(outfit));
    }
}


function populateDropdown(element, textContent, value=null, defaultValue=null) {
    element.innerHTML= '';
    for (let i = 0; i < textContent.length; i++) {
        const option = document.createElement('option');
        option.textContent = textContent[i];
        if (value && (value.length == textContent.length)) {
            option.value = value[i];
        }
        else {
            option.value = textContent[i];
        }
        element.appendChild(option)
    }
    if (defaultValue) {
        if (Array.isArray(defaultValue)) {
            for (const option of Array.from(element.options)) {
                option.selected = defaultValue.includes(option.value);
            }
        }
        if ((value && value.includes(defaultValue)) || textContent.includes(defaultValue)) {
            element.value = defaultValue;
        }
    }
}

function initAddButton() {
    const bottomSheet = document.querySelector('bottom-sheet');
    const itemAdd = new ItemAdd();
    bottomSheet.addStep(itemAdd, "Add Item")

    const closeEvents = ['add-submitted', 'add-canceled']
    closeEvents.forEach(event => {
        itemAdd.addEventListener(event,  () => {
            bottomSheet.closeSheet()
        });
    })
    
    const addItemButton = document.getElementById('add-button');
    addItemButton.addEventListener("click", () => {
        bottomSheet.openSheet()
    })
}

function initFilterSortButtons() {
    const filterButton = document.getElementById('filter-button')
    filterButton.addEventListener("click", () => {
        const itemFilter = document.querySelector("item-filter");
        itemFilter.classList.toggle("hidden");
    })

    const sortButton = document.getElementById('sort-button')
    sortButton.addEventListener("click", () => {
        const itemSort = document.querySelector("item-sort");
        itemSort.classList.toggle("hidden");
    })
}

function initOutfitsPage() {
    getSavedData();
    showOutfits();
    initAddButton();
}

function initItemsPage() {
    getSavedData();
    showItems();
    initAddButton();
    initFilterSortButtons();
}

function initSettingsPage() {
    getSavedData();

    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('jsonFileInput');
    const status = document.getElementById('status');

    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const jsonFile = fileInput.files[0];
        if (!jsonFile || jsonFile.type != "application/json") {
            fileInput.setCustomValidity("Invalid file.")
            return
        }
        try {
            const jsonText = await jsonFile.text();
            const jsonData =  JSON.parse(jsonText);
            const uploadedItems = jsonData['items']
            const uploadedOutfits = jsonData['outfits']
            saveData(items=uploadedItems, outfits=uploadedOutfits)
            status.textContent = "Uploaded successfully."
        }
        catch (error) {
            fileInput.setCustomValidity("Could not parse uploaded json.")
            console.error("Error reading JSON:", error)
            return
        }
    });

    const saveDataButton = document.getElementById('saveDataButton')
    saveDataButton.addEventListener('click', async () => {
        const closet_data = {
            "items": items,
            "outfits": outfits
        }
        const now = new Date();

        let yyyymmddhhmmss = `${now.getFullYear()}${now.getMonth()+1}${now.getDate()}`
        yyyymmddhhmmss += `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`
        
        const closet_data_json = JSON.stringify(closet_data, null, 2);
        const blob = new Blob([closet_data_json], {type: 'application/json'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `closet_data_${yyyymmddhhmmss}.json`;
        link.click()
        URL.revokeObjectURL(link.href);
    })

}


class NavBar extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        try {
            const response = await fetch('components/nav.html');
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            this.innerHTML = doc.body.innerHTML;

            // set up highlight
            const currentPage = document.body.dataset.page;
            const navClass = `.${currentPage}-nav`;
            const pageNavElement = this.querySelector(navClass);
            pageNavElement.classList.toggle('active', true);
        } catch (error) {
            console.error(`Failed to load external html`, error);
        }
    }
}
customElements.define('nav-bar', NavBar);


class ItemSort extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
                <div id="sort">
                    <button>Name</button>
                    <button>Type</button>
                    <button>Wishlist</button>
                    <button>Worn</button>
                </div>
        `;
        this.setup();
    }

    setup() {
        const buttons = this.querySelectorAll('button');
        const urlParams = new URLSearchParams(window.location.search);
        const sortby = urlParams.get('sortby')
        buttons.forEach(button => {
            if (sortby && sortby == button.textContent.toLowerCase()) {
                button.classList.toggle('active', true)
            }

            button.addEventListener("click", () => {
                const url = new URL(window.location.href);
                const param = button.textContent.toLowerCase();
                if (url.searchParams.get('sortby') == param) {
                    url.searchParams.delete('sortby');
                    button.classList.remove('active');
                } else {
                    url.searchParams.set('sortby', param);
                    buttons.forEach((btn) => btn.classList.remove('active'));
                    button.classList.add('active');
                }
                window.history.pushState({}, '', url);
                showItems();
                setTimeout(() => {
                    this.classList.toggle('hidden', true);
                }, 200)
            })
        })
    }
}
customElements.define('item-sort', ItemSort);


class ItemInput extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        try {
            const response = await fetch('components/item-input.html');
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            this.innerHTML = doc.body.innerHTML;
            this.setup()
        } catch (error) {
            console.error(`Failed to load external html`, error);
        }
    }

    setup() {
        this.nameInput = this.querySelector('.name-input');
        this.typeSelect = this.querySelector('.type-select');
        this.wishlistCheckbox = this.querySelector('.wishlist-checkbox');
        this.wornCheckbox = this.querySelector('.worn-checkbox');

        // populate dropdowns and add events submission
        populateDropdown(this.typeSelect, Object.keys(ITEM_TYPES));
        this.typeSelect.selectedIndex = -1;

        const submitButton = this.querySelector('.submit-button');
        submitButton.addEventListener("click", () => {
            this.handleSubmit()
        })

        const cancelButton = this.querySelector('.cancel-button');
        cancelButton.addEventListener("click", () => {
            this.handleCancel()
        })
    }

    handleSubmit() {}
    handleCancel() {}
}


class ItemAdd extends ItemInput {
    constructor() {
        super();
    }

    handleSubmit() {
        const name = this.nameInput.value;
        const type = this.typeSelect.value;
        const wishlist = this.wishlistCheckbox.checked;

        // add item to list
        let nameValidity = ""
        if (!name) {
            nameValidity = "Invalid field"
        } else if (items.map(item => item.name).includes(name)) {
            nameValidity = "Item already exists."
        }
        this.nameInput.setCustomValidity(nameValidity)
        
        let typeValidity = type ? "" : "Select a type."
        this.typeSelect.setCustomValidity(typeValidity)

        if (nameValidity || typeValidity) {
            return
        } else {
            items.push(new Item(name, type, wishlist))
        }

        saveData()
        showItems()
            
        const form = this.querySelector("form");
        if (form.checkValidity()) {
            form.reset();
        }
        
        this.dispatchEvent(new CustomEvent('add-submitted', {}));
    }

    handleCancel() {
        this.dispatchEvent(new CustomEvent('add-canceled', {}));
    }
}
customElements.define('item-add', ItemAdd);


class ItemEdit extends ItemInput {
    constructor(item, itemComponent) {
        super();
        this.item = item;
        this.itemComponent = itemComponent;
    }

    setup() {
        super.setup()
        this.nameInput.value = this.item.name;
        this.typeSelect.value = this.item.type;
        this.wishlistCheckbox.checked = this.item.wishlist;
        this.wornCheckbox.checked = this.item.worn;
    }

    handleSubmit() {
        this.item.name = this.nameInput.value;
        this.item.type = this.typeSelect.value;
        this.item.wishlist = this.wishlistCheckbox.checked;
        this.item.worn = this.wornCheckbox.checked;

        this.dispatchEvent(new CustomEvent('editing-submitted', {}));
    }

    handleCancel() {
        this.dispatchEvent(new CustomEvent('editing-canceled', {}));
    }
}
customElements.define('item-edit', ItemEdit);


class ItemFilter extends ItemInput {
    constructor() {
        super();
    }

    setup() {
        super.setup()

        // change Submit button to Filter, Cancel to Reset
        const submitButton = this.querySelector('.submit-button');
        submitButton.textContent = "Filter";
        const cancelButton = this.querySelector('.cancel-button');
        cancelButton.type = "reset";
        cancelButton.textContent = "Reset";

        // make type dropdown multi select
        this.typeSelect.multiple = true;

        // change checkboxes to tristate checkboxes
        this.triStateWishlistCheckbox = new TriStateCheckbox();
        this.wishlistCheckbox.replaceWith(this.triStateWishlistCheckbox);

        this.triStateWornCheckbox = new TriStateCheckbox();
        this.wornCheckbox.replaceWith(this.triStateWornCheckbox);

        // display current selections
        const urlParams = new URLSearchParams(window.location.search);
        const name = urlParams.get('name');
        if (name) {
            this.nameInput.textContent = name;
        }
        const types = urlParams.getAll('type');
        if (types.length > 0) {
            for (const option of this.typeSelect.options) {
                option.selected = types.includes(option.value);
            }
        }
        const wishlist = urlParams.get('wishlist');
        if (wishlist != null) {
            this.triStateWishlistCheckbox.currState = wishlist;
        }
        const worn = urlParams.get('worn');
        if (worn != null) {
            this.triStateWornCheckbox.currState = worn;
        }

    }

    updateFilterParams() {
        const name = this.nameInput.value;
        const types = Array.from(this.typeSelect.selectedOptions).map(option => option.value);
        const wishlist = this.triStateWishlistCheckbox.currState;
        const worn = this.triStateWornCheckbox.currState;

        const url = new URL(window.location.href);

        if (name) {
            url.searchParams.set('name', name);
        } else {
            url.searchParams.delete('name');
        }

        url.searchParams.delete('type');
        types.forEach(type => url.searchParams.append('type', type));
        
        if (wishlist == TriStateCheckbox.state.NEUTRAL) {
            url.searchParams.delete('wishlist')
        } else {
            url.searchParams.set('wishlist', wishlist);
        }

        if (worn == TriStateCheckbox.state.NEUTRAL) {
            url.searchParams.delete('worn')
        } else {
            url.searchParams.set('worn', worn);
        }
        
        window.history.pushState({}, '', url);

        showItems();
        this.classList.toggle("hidden", true);
    }

    handleSubmit() {
        this.updateFilterParams();
    }

    handleCancel() {
        setTimeout(() => {
            this.updateFilterParams();
        }, 1);
    }

}
customElements.define('item-filter', ItemFilter);


class TriStateCheckbox extends HTMLElement {
    static state = {
        EXCLUDE: 0,
        INCLUDE: 1,
        NEUTRAL: 2
    }

    constructor() {
        super();
        this.currState = TriStateCheckbox.state.NEUTRAL;
    }

    async connectedCallback() {
        this.innerHTML = "<input type='checkbox'>"
        this.setup()
    }

    setup() {
        const checkbox = this.querySelector('input')
        checkbox.addEventListener('click', (e) => {    
            this.currState = (this.currState + 2) % 3; // 2 comes from (-1 + 3) to reverse modulo 3

            if (this.currState === TriStateCheckbox.state.EXCLUDE) {
                checkbox.checked = false;
                checkbox.indeterminate = true;
            } else if (this.currState === TriStateCheckbox.state.INCLUDE) {
                checkbox.checked = true;
                checkbox.indeterminate = false;
            } else if (this.currState === TriStateCheckbox.state.NEUTRAL) {
                checkbox.checked = false;
                checkbox.indeterminate = false;
            }
        });

        const parentForm = this.closest('form'); 
        parentForm.addEventListener('reset', () => {
            setTimeout(() => {
                this.currState = TriStateCheckbox.state.NEUTRAL;
                checkbox.checked = false;
                checkbox.indeterminate = false;
            }, 0);
        });
    }
}
customElements.define('tristate-checkbox', TriStateCheckbox);


class BottomSheet extends HTMLElement {
    constructor() {
        super();
        this._isConnectedPromise = new Promise((resolve) => {
            this._resolveConnected = resolve;
        });
    }

    async connectedCallback() {
        try {
            const response = await fetch('components/bottom-sheet.html');
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            this.innerHTML = doc.body.innerHTML;
            this.setup()
        } catch (error) {
            console.error(`Failed to load external html`, error);
        }
    }

    setup() {
        const backdrop = document.getElementById('backdrop');
        const closeButton = this.querySelector('.close-button');
        const closeClickButtons = [backdrop, closeButton]
        closeClickButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.closeSheet();
            });
        })
        console.log('setup')
        this._resolveConnected();

        // const backButton = bottomSheet.querySelector('.back-button');
        // backButton.addEventListener('click', () => {
        //     if (activeStep > 1) {
        //         goToStep(activeStep - 1);
        //     }
        // });
    }

    async addStep(element, stepTitle) {
        await this._isConnectedPromise;

        const steps = this.querySelectorAll('.sheet-step');
        const currStep = steps.length + 1;
        const sheetStep = document.createElement('div');
        sheetStep.className = 'sheet-step active';
        sheetStep.dataset.step = currStep;
        sheetStep.dataset.title = stepTitle;

        sheetStep.appendChild(element);
        const sheetBody = this.querySelector('.sheet-body');
        sheetBody.appendChild(sheetStep);
        console.log(this)
    }

    async openSheet() {
        await this._isConnectedPromise;

        this.classList.add('show');
        document.getElementById('backdrop').classList.toggle('hidden', false);
        this.goToStep(1)
    }

    closeSheet() {
        this.classList.remove('show');
        document.getElementById('backdrop').classList.toggle('hidden', true);
    }

    goToStep(stepNumber) {
        const steps = this.querySelectorAll('.sheet-step');
        const targetStep = this.querySelector(`.sheet-step[data-step="${stepNumber}"]`);
        if (!targetStep) return;

        steps.forEach(step => step.classList.remove('active'));
        targetStep.classList.add('active');
        let activeStep = stepNumber;

        const headerTitle = this.querySelector('.header-title');
        headerTitle.textContent = targetStep.getAttribute('data-title');
        
        // if (activeStep > 1 && activeStep < steps.length) {
        //     backButton.classList.remove('hidden');
        // } else {
        //     backButton.classList.add('hidden'); // Hide on Step 1 or Final completion screen
        // }
    }
}
customElements.define('bottom-sheet', BottomSheet);

class ItemComponent extends HTMLElement {
    constructor(item) {
        super();
        this.item = item;
    }

    async connectedCallback() {
        try {
            const response = await fetch('components/item.html');
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            this.innerHTML = doc.body.innerHTML;
            this.setup()
        } catch (error) {
            console.error(`Failed to load external html`, error);
        }
    }

    setup() {
        this.updateInfo();

        // add button listeners
        const itemButton = this.querySelector('.item-button');
        itemButton.addEventListener('click', () => {
            this.toggleOptions();
            this.scrollToFit();
        })

        const editButton = this.querySelector(".edit-button");
        editButton.addEventListener("click", () => {
            this.toggleEditing();
            this.scrollToFit()
        })

        const deleteButton = this.querySelector(".delete-button");
        deleteButton.addEventListener("click", () => {
            this.toggleOptions(false);
            items = items.filter(currItem => currItem !== this.item)
            saveData()
            showItems()
        })
    }

    updateInfo() {
        this.querySelector('.item-name').textContent = this.item.name;
        const typeIcon = this.querySelector('.item-icon');
        typeIcon.style.setProperty('--icon-src', `url('/icons/items/${this.item.type}.svg')`)
        
        for (const [color, colorValues] of Object.entries(ITEM_COLORS)) {
            if (this.item.name.includes(color)) {
                this.style.setProperty('--item-color-light', colorValues['light'])
                this.style.setProperty('--item-color-dark', colorValues['dark'])
                if (colorValues?.['outline']) {
                    this.style.setProperty('--item-color-outline', colorValues['outline'])
                } else {
                    this.style.setProperty('--item-color-outline', colorValues['light'])
                }
                break;
            }
        }
        this.classList.toggle('worn', this.item.worn);
        const wishlistIcon = this.querySelector('.wishlist-icon');
        wishlistIcon.classList.toggle('hidden', !this.item.wishlist);
    }
    
    toggleOptions(toggle=null) {
        const itemOptions = this.querySelector(".item-options");
        const backdrop = document.getElementById('backdrop');
        const optionsOpen = toggle != null ? toggle : itemOptions.classList.contains('hidden');

        itemOptions.classList.toggle('hidden', !optionsOpen);
        backdrop.classList.toggle('hidden', !optionsOpen);
        itemOptions.classList.toggle('active', optionsOpen);
        this.classList.toggle('active', optionsOpen);

        if (optionsOpen) {
            backdrop.addEventListener('click', () => {
                this.toggleOptions(false);
            }, {once: true})
        }
    }

    toggleEditing(toggle=null) {
        const bottomSheet = new BottomSheet();
        const itemEdit = new ItemEdit(this.item, this);
        bottomSheet.addStep(itemEdit, "Edit Item");
        this.appendChild(bottomSheet);
        this.toggleOptions();
        bottomSheet.openSheet();
        
        itemEdit.addEventListener('editing-submitted', () => {
            this.updateInfo();
            bottomSheet.closeSheet();
            showItems();
            saveData();
        }, {once: true})

        itemEdit.addEventListener('editing-canceled', () => {
            bottomSheet.closeSheet()
        }, {once: true})
    }
    
    scrollToFit() {
        const itemOptions = this.querySelector('.item-options')
        if (itemOptions.classList.contains('active')) {
            console.log("scrolling")
            setTimeout(() => {
                this.scrollIntoView({
                    behavior: 'smooth', block: 'nearest', inline:'nearest'
                });
            }, 50);
        }
    }
}
customElements.define('item-component', ItemComponent);



class OutfitInput extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        try {
            const response = await fetch('components/outfit-input.html');
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            this.innerHTML = doc.body.innerHTML;
            this.setup()
        } catch (error) {
            console.error(`Failed to load external html`, error);
        }
    }

    setup() {
        this.itemsSelect = this.querySelector('.items-select');
        this.weatherSelect = this.querySelector('.weather-select');
        this.starsSelect = this.querySelector('.stars-select');
        this.availableCheckbox = this.querySelector('.available-checkbox');
        this.wishlistCheckbox = this.querySelector('.wishlist-checkbox');

        // populate dropdowns and add events submission
        populateDropdown(this.itemsSelect, items.map(item => item.name));
        this.itemsSelect.value = -1;
        populateDropdown(this.weatherSelect, Object.keys(WEATHER));
        this.weatherSelect.value = -1;
        const starsValueList = [...Array(5).keys()].map(n => n + 1);
        const starSymbolsList = starsValueList.map(num => Array(num+1).join(STAR_UNICODE));
        populateDropdown(this.starsSelect, starSymbolsList, starsValueList);
        this.starsSelect.value = -1;

        const submitButton = this.querySelector('.submit-button');
        submitButton.addEventListener("click", () => {
            this.handleSubmit()
        })

        const cancelButton = this.querySelector('.cancel-button');
        cancelButton.addEventListener("click", () => {
            this.handleCancel()
        })
    }
}


class OutfitAdd extends OutfitInput {
    constructor() {
        super();
    }

    setup() {
        super.setup();
        this.availableCheckbox.classList.add('hidden');
        this.querySelector("label[for='available-checkbox']").classList.add('hidden');
    }

    handleSubmit() {
        const selectedItemNames = Array.from(this.itemsSelect.selectedOptions).
                                    map(option => option.value);
        const selectedItems = selectedItemNames.map(itemName => getItemByName(itemName));
        const weather = this.weatherSelect.value;
        const stars = this.starsSelect.value;
        
        const itemsValidity = selectedItems ? "" : "Select at least one item."
        this.itemsSelect.setCustomValidity(itemsValidity);
        const weatherValidity = weather ? "" : "Select weather."
        this.weatherSelect.setCustomValidity(weatherValidity);
        const starsValidity = stars ? "" : "Select stars.";
        this.starsSelect.setCustomValidity(starsValidity);

        if (itemsValidity || weatherValidity || starsValidity) {
            return
        } else {
            outfits.push(new Outfit(selectedItems, weather, stars))
        }

        saveData()
        showOutfits()
            
        const form = this.querySelector("form");
        if (form.checkValidity()) {
            form.reset();
        }
    }
}
customElements.define('outfit-add', OutfitAdd);


class OutfitEdit extends OutfitInput {
    constructor(outfit, outfitComponent) {
        super();
        this.outfit = outfit;
        this.outfitComponent = outfitComponent;
    }

    setup() {
        super.setup()
        populateDropdown(this.itemsSelect, items.map(item => item.name), null, this.outfit.items.map(item => item.name))
        populateDropdown(this.weatherSelect, Object.keys(WEATHER), null, this.outfit.weather)
        const starsValueList = [...Array(5).keys()].map(n => n + 1)
        const starSymbolsList = starsValueList.map(num => Array(num+1).join(STAR_UNICODE))
        populateDropdown(this.starsSelect, starSymbolsList, starsValueList, this.outfit.stars)
        this.availableCheckbox.checked = this.outfit.isAvailable()
    }

    handleSubmit() {
        const selectedItemNames = Array.from(this.itemsSelect.selectedOptions).
                                    map(option => option.value);
        this.outfit.items = selectedItemNames.map(itemName => getItemByName(itemName));
        this.outfit.weather = this.weatherSelect.value;
        this.outfit.stars = parseInt(this.starsSelect.value, 10);

        if (this.availableCheckbox.checked != this.outfit.isAvailable()) {
            for (const item of this.outfit.items) {
                const excludedTypes = ['accessory', 'outerwear', 'shoes']
                if (!excludedTypes.includes(item.type)) {
                    item.worn = !this.availableCheckbox.checked;
                }
            }
        }
        this.dispatchEvent(new CustomEvent('editing-submitted', {}));
    }

    handleCancel() {
        this.dispatchEvent(new CustomEvent('editing-canceled', {}));
    }
}
customElements.define('outfit-edit', OutfitEdit);


class OutfitFilter extends OutfitInput {
    constructor() {
        super();
    }

    setup() {
        super.setup()
        // change Submit button to say Filter, hide Cancel button
        const submitButton = this.querySelector('.submit-button');
        submitButton.textContent = "Filter";
        const cancelButton = this.querySelector('.cancel-button');
        cancelButton.classList.toggle("hidden", true);

        // make dropdowns multi select
        this.weatherSelect.multiple = true;
        this.starsSelect.multiple = true;

        // change checkboxes to tristate checkboxes
        this.triStateAvailableCheckbox = new TriStateCheckbox();
        this.availableCheckbox.replaceWith(this.triStateAvailableCheckbox);

        // unhide wishlist option
        const wishlistCheckboxLabel = this.querySelector('label[for="wishlist-checkbox"]')
        this.wishlistCheckbox.classList.remove('hidden');
        wishlistCheckboxLabel.classList.remove('hidden');

    }

    handleSubmit() {
        const selectedItemNames = Array.from(this.itemsSelect.selectedOptions).
                                    map(option => option.value);
        const weather = Array.from(this.weatherSelect.selectedOptions).map(option => option.value);
        const stars = Array.from(this.starsSelect.selectedOptions).map(option => parseInt(option.value, 10));
        const available = this.triStateAvailableCheckbox.currState;
        const wishlist = this.wishlistCheckbox.currState;
        

        const filter = {
            'items': selectedItemNames,  // string array
            'weather': weather,  // string
            'stars': stars,  // number
            'available': available,  // TriStateCheckbox.state
            'wishlist': wishlist  // TriStateCheckbox.state
        }
        showOutfits(filter)
    }
}
customElements.define('outfit-filter', OutfitFilter);


class OutfitComponent extends HTMLElement {
    constructor(outfit) {
        super();
        this.outfit = outfit;
    }

    async connectedCallback() {
        try {
            const response = await fetch('components/outfit.html');
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            this.innerHTML = doc.body.innerHTML;
            this.setup()
        } catch (error) {
            console.error(`Failed to load external html`, error);
        }
    }

    setup() {
        this.updateInfo();
        const editPlaceholder = this.querySelector('.edit-placeholder');
        const outfitEdit = new OutfitEdit(this.outfit, this);
        editPlaceholder.replaceWith(outfitEdit);
        outfitEdit.classList.add('hidden');

        // add button listeners
        const editButton = this.querySelector(".edit-button");
        editButton.addEventListener("click", () => {
            this.toggleEditing();
            this.scrollToFit()
        })

        const deleteButton = this.querySelector(".delete-button");
        deleteButton.addEventListener("click", () => {
            outfits = outfits.filter(currOutfit => currOutfit != this.outfit);
            saveData();
            showOutfits();
        })

        const details = this.querySelector('details')
        details.addEventListener('toggle', () => {
            this.scrollToFit()
        })

        outfitEdit.addEventListener('editing-submitted', () => {
            this.toggleEditing();
            this.updateInfo();
            saveData();
        })

        outfitEdit.addEventListener('editing-canceled', () => {
            this.toggleEditing();
        })
    }

    updateInfo() {
        const outfitItems = this.outfit.items.map(item => item.name).join(", ")
        this.querySelector(".outfit-items").textContent = outfitItems;

        let outfitInfo = `${this.outfit.weather}`
        outfitInfo += `\n${Array(parseInt(this.outfit.stars, 10)+1).join(STAR_UNICODE)}`
        if (this.outfit.isAvailable()) {
            outfitInfo += "\navailable \u2714"
        } else {
            outfitInfo += "\nworn"
        }
        if (this.outfit.isWishlist()) { outfitInfo += "\nwishlist"}
        this.querySelector(".component-info").textContent = outfitInfo;
    }
    
    toggleEditing(toggle=null) {
        const editOptions = this.querySelector("outfit-edit");
        const editing = toggle != null ? toggle : editOptions.classList.contains('hidden');
        editOptions.classList.toggle('hidden', !editing);
        this.querySelector(".component-info").classList.toggle('hidden', editing);
    }
    
    scrollToFit() {
        const details = this.querySelector('details')
        if (details.open) {
            setTimeout(() => {
                this.scrollIntoView({
                    behavior: 'smooth', block: 'nearest', inline:'nearest'
                });
            }, 50);
        }
    }
}
customElements.define('outfit-component', OutfitComponent);
