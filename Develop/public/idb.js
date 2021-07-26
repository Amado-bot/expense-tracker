let db;

const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_trans', { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;

    if (navigator.onLine) {
        uploadTrans();
    }
};

request.onerror = function(event) {
    // log error
    console.log(event.target.errorCode);
};

// saves budget record if there is no internet connection
const saveRecord = record => {
    const transaction = db.transaction(['new_trans'], 'readwrite');

    const transObjectStore = transaction.objectStore('new_trans');

    transObjectStore.add(record);
};

const uploadTrans = () => {
    const transaction = db.transaction(['new_trans'], 'readwrite');

    const transObjectStore = transaction.objectStore('new_trans');

    const getAll = transObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST', 
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type' : 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }

                    const transaction = db.transaction(['new_trans'], 'readwrite');

                    const transObjectStore = transaction.objectStore('new_trans');

                    transObjectStore.clear();

                    alert('All saved transactions have been submitted!');
                    location.reload();
                })
                .catch(err => {
                    console.log(err);
                });
        };
    };
};

// listen for app coming back online   
window.addEventListener('online', uploadTrans); 