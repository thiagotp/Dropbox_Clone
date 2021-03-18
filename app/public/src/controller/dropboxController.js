class DropBoxController {

    constructor() {

        this.btnSendFile = document.querySelector('#btn-send-file')
        this.inputFiles = document.querySelector('#files')
        this.progressBar = document.querySelector('#react-snackbar-root')
        this.initEvents();

    }

    initEvents() {

        this.btnSendFile.addEventListener('click', (e) => {

            this.inputFiles.click()

        });

        this.inputFiles.addEventListener('change', (e) => {

            console.log(e.target.files)
            this.uploadTask(e.target.files)
            this.progressBar.style.display = 'block';

        })
    }

    uploadTask(files) {

        console.log(files);
        let promises = [];

        [...files].forEach(file => {
            promises.push(new Promise((resolve, reject) => {
                console.log(file)
                let ajax = new XMLHttpRequest();
                ajax.open('POST', '/upload');
                ajax.onload = event => {
                    
                    try {
                        resolve(JSON.parse(ajax.responseText));
                    } catch (e) {
                        reject(e);
                    }

                }
                
                ajax.onerror = event => {
                    reject(event);
                }
                
                let formData = new FormData();
                
                console.log(file)
                formData.append('input-file', file);
                ajax.send(formData);

            }))
        })

        return Promise.all(promises)

    }
}