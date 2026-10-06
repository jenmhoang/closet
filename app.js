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


function showItems(filter={}) {
    const componentsDiv = document.getElementById('components-list')
    componentsDiv.replaceChildren()

    filteredItems = items;
    if (Object.keys(filter).length != 0) {
        if (filter?.['name'] && filter['name'].trim()) { // string
            filteredItems = filteredItems.filter(item => item.name.includes(filter['name']))
        }
        if (filter?.['type'] && filter['type'].length > 0) {
            filteredItems = filteredItems.filter(item => filter['type'].includes(item.type))
        }
        if (Object.keys(filter).includes('wishlist') &&
                filter['wishlist'] != TriStateCheckbox.state.NEUTRAL) {
            filteredItems = filteredItems.filter(item => item.wishlist == filter['wishlist'])
        }
        if (Object.keys(filter).includes('worn') && 
                filter['worn'] != TriStateCheckbox.state.NEUTRAL) {
            filteredItems = filteredItems.filter(item => item.worn == filter['worn'])
        }
        if (Object.keys(filter).includes('wishlist') && 
                filter['wishlist'] != TriStateCheckbox.state.NEUTRAL) {
            filteredItems = filteredItems.filter(item => item.wishlist == filter['wishlist'])
        }
    }

    for (const item of filteredItems) {
        componentsDiv.appendChild(new ItemComponent(item));
    }
}



function showOutfits(filter={}) {
    const componentsDiv = document.getElementById('components-list')
    componentsDiv.replaceChildren()
    
    filteredOutfits = outfits;
    if (Object.keys(filter).length != 0) {
        if (filter?.['items'] && filter['items'].length > 0) {
            filteredOutfits = filteredOutfits.filter(outfit => 
                filter['items'].some(itemName => outfit.items.map(item => item.name).includes(itemName)))
            console.log(filteredOutfits)
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
    const addItemButton = document.getElementById('add-button');
    addItemButton.addEventListener("click", () => {
        const addDialog = document.getElementById("add-dialog");
        addDialog.showModal();
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
        // change Submit button to say Filter, hide Cancel button
        const submitButton = this.querySelector('.submit-button');
        submitButton.textContent = "Filter";
        const cancelButton = this.querySelector('.cancel-button');
        cancelButton.classList.toggle("hidden", true);

        // make type dropdown multi select
        this.typeSelect.multiple = true;

        // change checkboxes to tristate checkboxes
        this.triStateWishlistCheckbox = document.createElement('tristate-checkbox');
        this.wishlistCheckbox.replaceWith(this.triStateWishlistCheckbox);

        this.triStateWornCheckbox = document.createElement('tristate-checkbox');
        this.wornCheckbox.replaceWith(this.triStateWornCheckbox);
    }

    handleSubmit() {
        const name = this.nameInput.value;
        const type = Array.from(this.typeSelect.selectedOptions).map(option => option.value);
        const wishlist = this.triStateWishlistCheckbox.currState;
        const worn = this.triStateWornCheckbox.currState;
        
        const filter = {
            'name': name, // string
            'type': type, // string array
            'wishlist': wishlist, // TriStateCheckbox.state
            'worn': worn // TriStateCheckbox.state
        }
        showItems(filter)
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
    }
}
customElements.define('tristate-checkbox', TriStateCheckbox);



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
        const itemEditPlaceholder = this.querySelector('.edit-placeholder');
        const itemEdit = new ItemEdit(this.item, this)
        itemEditPlaceholder.replaceWith(itemEdit);
        itemEdit.classList.add('hidden');

        // add button listeners
        const editButton = this.querySelector(".edit-button");
        editButton.addEventListener("click", () => {
            this.toggleEditing();
            this.scrollToFit()
        })

        const deleteButton = this.querySelector(".delete-button");
        deleteButton.addEventListener("click", () => {
            items = items.filter(currItem => currItem !== this.item)
            saveData()
            showItems()
        })

        const details = this.querySelector('details')
        details.addEventListener('toggle', () => {
            this.scrollToFit()
        })

        itemEdit.addEventListener('editing-submitted', () => {
            this.toggleEditing();
            this.updateInfo();
            saveData();
        })

        itemEdit.addEventListener('editing-canceled', () => {
            this.toggleEditing();
        })
    }

    updateInfo() {
        this.querySelector('.item-name').textContent = this.item.name;
        let itemInfo = `${this.item.type}`;
        if (this.item.wishlist) { itemInfo += "\nwishlist" };
        if (this.item.worn) { itemInfo += "\nworn"};
        this.querySelector(".component-info").textContent = itemInfo;
    }
    
    toggleEditing(toggle=null) {
        const editOptions = this.querySelector("item-edit");
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
        this.triStateAvailableCheckbox = document.createElement('tristate-checkbox');
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
