class DropBoxController {

    constructor() {

        this.onSelectionChange = new Event('selectionchange')
        this.currentFolder = ['hcode']
        this.btnSendFile = document.querySelector('#btn-send-file')
        this.btnDelete = document.querySelector('#btn-delete')
        this.btnNewFolder = document.querySelector('#btn-new-folder')
        this.btnRename = document.querySelector('#btn-rename')
        this.navEl = document.querySelector('#browse-location')
        this.inputFiles = document.querySelector('#files')

        this.snackBar = document.querySelector('#react-snackbar-root')
        this.progressBar = this.snackBar.querySelector('.mc-progress-bar-fg')
        this.nameFileBar = this.snackBar.querySelector('.filename')
        this.timeFileBar = this.snackBar.querySelector('.timeleft')
        this.listFiles = document.querySelector("#list-of-files-and-directories")
        this.connectFirebase()
        this.openFolder()
        this.readFilesFb()

    }

    connectFirebase() {

        // Your web app's Firebase configuration
        // For Firebase JS SDK v7.20.0 and later, measurementId is optional
        var firebaseConfig = {
            apiKey: "AIzaSyAcGLRmH5uOQF8l8TvFZl4O7odITZ7Nm0s",
            authDomain: "dropbox-clone-4bacc.firebaseapp.com",
            databaseURL: "https://dropbox-clone-4bacc-default-rtdb.firebaseio.com",
            projectId: "dropbox-clone-4bacc",
            storageBucket: "dropbox-clone-4bacc.appspot.com",
            messagingSenderId: "109668133853",
            appId: "1:109668133853:web:8e0f4accff148944236434",
            measurementId: "G-QRXY1G6216"
        };
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        firebase.analytics();

    }

    itemSelection() {

        return this.listFiles.querySelectorAll(".selected")

    }

    removeTask() {

        let promises = [];

        this.itemSelection().forEach(li => {

            let file = JSON.parse(li.dataset.file);
            let key = li.dataset.key

            promises.push(new Promise((resolve, reject) => {

                let fileRef = firebase.storage().ref(this.currentFolder.join('/')).child(file.name)

                fileRef.delete().then(() => {

                    resolve({
                        fields:{
                            key
                        }
                    })

                }).catch(err => {

                    reject(err)

                })

            }))

        })

        return Promise.all(promises)

    }

    initEvents() {

        this.btnNewFolder.addEventListener("click", event => {

            let name = prompt("Nome da Pasta: ")

            if (name) {

                this.firebaseRef().push().set({
                    name,
                    type: "folder",
                    path: this.currentFolder.join('/')
                })
            }

        })

        this.btnRename.addEventListener("click", event => {

            let li = this.itemSelection()[0]
            let file = JSON.parse(li.dataset.file)

            let name = prompt("Renomear o arquivo: ", file.name)

            if (name) {

                file.name = name
                this.firebaseRef().child(li.dataset.key).set(file)

            }

        })

        this.btnDelete.addEventListener("click", event => {

            this.removeTask().then(responses => {

                responses.forEach(response => {

                    if (response.fields.key) {
                        this.firebaseRef().child(response.fields.key).remove()
                    }

                })

            }).catch(err => {

                console.log(err)

            })

        })

        this.listFiles.addEventListener('selectionchange', e => {

            switch (this.itemSelection().length) {
                case 0:
                    this.btnDelete.style.display = 'none';
                    this.btnRename.style.display = 'none';
                    break;
                case 1:
                    this.btnDelete.style.display = 'block';
                    this.btnRename.style.display = 'block';
                    break;
                default:
                    this.btnDelete.style.display = 'block';
                    this.btnRename.style.display = 'none';
                    break;
            }

        })

        this.btnSendFile.addEventListener('click', (e) => {

            this.inputFiles.click();

        });

        this.inputFiles.addEventListener('change', (e) => {

            this.btnSendFile.disabled = true;

            this.uploadTask(e.target.files).then(responses => {

                responses.forEach(res => {

                    this.firebaseRef().push().set({

                        name: res.name,
                        type: res.contentType,
                        path: res.customMetadata,
                        size: res.size

                    })
                    console.log(responses)

                })

                this.uploadComplete();

            }).catch(e => {

                this.uploadComplete();
                console.log(e);

            });

            this.modalShow();

        })
    }//iniciando os eventos.Adidionando o click ao botão de upload e adicionando ao firebase o arquivo que fez upload

    uploadComplete() {

        setTimeout(() => {
            this.modalShow(false)
        }, 2000);
        this.btnSendFile.disabled = false;
        this.inputFiles.value = '';

    }//Ajustando mensagem ao término do upload

    modalShow(show = true) {

        this.snackBar.style.display = (show) ? 'block' : 'none';

    }//mostrando o progresso do upload

    firebaseRef(path) {

        if (!path) path = this.currentFolder.join('/')

        return firebase.database().ref(path)

    }//referência para o firebase

    ajax(method = "GET", url, formData = new FormData(), onprogress = function () { }, onloardstart = function () { }) {

        console.log(method)
        console.log(url)
        for (var pair of formData.entries()) {
            console.log(pair[0] + ', ' + pair[1]);
        }

        return new Promise((resolve, reject) => {


            let ajax = new XMLHttpRequest();
            ajax.open(method, url);
            ajax.onload = event => {
                console.log(ajax)
                console.log(ajax.responseText)
                try {
                    resolve(JSON.parse(ajax.responseText));
                } catch (e) {
                    reject(e);
                }

            }

            ajax.onerror = event => {

                reject(event);

            }

            ajax.upload.onprogress = onprogress

            onloardstart();

            ajax.send(formData);

        })

    }

    uploadTask(files) {

        let promises = [];

        [...files].forEach(file => {


            promises.push(new Promise((resolve, reject) => {

                let fileRef = firebase.storage().ref(this.currentFolder.join('/')).child(file.name)

                let task = fileRef.put(file)

                task.on('state_changed', snapshot => {

                    this.uploadProgress({

                        loaded: snapshot.bytesTransferred,
                        total: snapshot.totalBytes

                    }, file)

                }, error => {

                    console.error(error)
                    reject(error)

                }, () => {
                    task.snapshot.ref.getDownloadURL().then(url => {
                        task.snapshot.ref.updateMetadata({ customMetadata: { url } }).then(mtdata => {
                            resolve(mtdata);
                        });
                    }).catch(err => {

                        reject(err);

                    })

                })

            }))

        })

        return Promise.all(promises)

    }//Método que é responsável por salvar o arquivo selecionado na pasta public do projeto

    /**
                let formData = new FormData();
    
                formData.append('input-file', file)
    
                let promise = this.ajax("POST", '/upload', formData, () => {
    
                    this.uploadProgress(event, file);
    
                }, () => {
    
                    this.startUploadTime = Date.now();
    
                })
    
                promises.push(promise)
     */

    uploadProgress(event, file) {

        let timeSpent = Date.now() - this.startUploadTime
        let loaded = event.loaded
        let total = event.total
        let porcent = parseInt((loaded / total) * 100);

        let timeLeft = ((100 - porcent) * timeSpent) / porcent

        this.progressBar.style.width = `${porcent}%`;
        this.nameFileBar.innerHTML = `Upload Arquivo: ${file.name}`;

        if (porcent < 100) {

            this.timeFileBar.innerHTML = `Tempo: ${this.formatTime(timeLeft)}`

        } else {

            this.timeFileBar.innerHTML = "Upload Concluído"

        }

    }//Método responsável para configurar a exibição do tempo necessário para upload

    formatTime(duration) {

        let seconds = parseInt((duration / 1000) % 60)
        let minutes = parseInt((duration / (1000 * 60)) % 60)
        let hours = parseInt((duration / (1000 * 60 * 60)) % 24)

        if (hours > 0) {
            return `${hours} Horas ${minutes} minutos ${seconds} segundos`
        }

        if (minutes > 0) {
            return `${minutes} Minutos ${seconds} segundos`
        }

        if (seconds > 0) {
            return `${seconds} Segundos`
        }

        return ""
    }

    switchViewFileIcon(file) {

        switch (file.type) {
            case 'folder':
                return `
                    <svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                        <title>content-folder-large</title>
                        <g fill="none" fill-rule="evenodd">
                            <path d="M77.955 53h50.04A3.002 3.002 0 0 1 131 56.007v58.988a4.008 4.008 0 0 1-4.003 4.005H39.003A4.002 4.002 0 0 1 35 114.995V45.99c0-2.206 1.79-3.99 3.997-3.99h26.002c1.666 0 3.667 1.166 4.49 2.605l3.341 5.848s1.281 2.544 5.12 2.544l.005.003z"
                            fill="#71B9F4"></path>
                            <path d="M77.955 52h50.04A3.002 3.002 0 0 1 131 55.007v58.988a4.008 4.008 0 0 1-4.003 4.005H39.003A4.002 4.002 0 0 1 35 113.995V44.99c0-2.206 1.79-3.99 3.997-3.99h26.002c1.666 0 3.667 1.166 4.49 2.605l3.341 5.848s1.281 2.544 5.12 2.544l.005.003z"
                            fill="#92CEFF"></path>
                        </g>
                    </svg>`;
                break;

            case 'video/mp4':
            case 'video/quicktime':
                return `
                <svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                                        <title>content-video-large</title>
                                        <defs>
                                            <rect id="mc-content-video-large-b" x="30" y="43" width="100" height="74" rx="4"></rect>
                                            <filter x="-.5%" y="-.7%" width="101%" height="102.7%" filterUnits="objectBoundingBox" id="mc-content-video-large-a">
                                                <feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
                                                <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix>
                                            </filter>
                                        </defs>
                                        <g fill="none" fill-rule="evenodd">
                                            <g>
                                                <use fill="#000" filter="url(#mc-content-video-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-video-large-b"></use>
                                                <use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-video-large-b"></use>
                                            </g>
                                            <path d="M69 67.991c0-1.1.808-1.587 1.794-1.094l24.412 12.206c.99.495.986 1.3 0 1.794L70.794 93.103c-.99.495-1.794-.003-1.794-1.094V67.99z" fill="#637282"></path>
                                        </g>
                                    </svg>
                `;
                break;

            case 'audio/mp3':
            case 'audio/ogg':
            case 'audio/mpeg':
                return `
                <svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                                        <title>content-audio-large</title>
                                        <defs>
                                            <rect id="mc-content-audio-large-b" x="30" y="43" width="100" height="74" rx="4"></rect>
                                            <filter x="-.5%" y="-.7%" width="101%" height="102.7%" filterUnits="objectBoundingBox" id="mc-content-audio-large-a">
                                                <feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
                                                <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix>
                                            </filter>
                                        </defs>
                                        <g fill="none" fill-rule="evenodd">
                                            <g>
                                                <use fill="#000" filter="url(#mc-content-audio-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-audio-large-b"></use>
                                                <use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-audio-large-b"></use>
                                            </g>
                                            <path d="M67 60c0-1.657 1.347-3 3-3 1.657 0 3 1.352 3 3v40c0 1.657-1.347 3-3 3-1.657 0-3-1.352-3-3V60zM57 78c0-1.657 1.347-3 3-3 1.657 0 3 1.349 3 3v4c0 1.657-1.347 3-3 3-1.657 0-3-1.349-3-3v-4zm40 0c0-1.657 1.347-3 3-3 1.657 0 3 1.349 3 3v4c0 1.657-1.347 3-3 3-1.657 0-3-1.349-3-3v-4zm-20-5.006A3 3 0 0 1 80 70c1.657 0 3 1.343 3 2.994v14.012A3 3 0 0 1 80 90c-1.657 0-3-1.343-3-2.994V72.994zM87 68c0-1.657 1.347-3 3-3 1.657 0 3 1.347 3 3v24c0 1.657-1.347 3-3 3-1.657 0-3-1.347-3-3V68z" fill="#637282"></path>
                                        </g>
                                    </svg>
                `;
                break;

            case 'application/pdf':
                return `
                <svg version="1.1" id="Camada_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="160px" height="160px" viewBox="0 0 160 160" enable-background="new 0 0 160 160" xml:space="preserve">
                                        <filter height="102%" width="101.4%" id="mc-content-unknown-large-a" filterUnits="objectBoundingBox" y="-.5%" x="-.7%">
                                            <feOffset result="shadowOffsetOuter1" in="SourceAlpha" dy="1"></feOffset>
                                            <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1">
                                            </feColorMatrix>
                                        </filter>
                                        <title>PDF</title>
                                        <g>
                                            <g>
                                                <g filter="url(#mc-content-unknown-large-a)">
                                                    <path id="mc-content-unknown-large-b_2_" d="M47,30h66c2.209,0,4,1.791,4,4v92c0,2.209-1.791,4-4,4H47c-2.209,0-4-1.791-4-4V34
                                                            C43,31.791,44.791,30,47,30z"></path>
                                                </g>
                                                <g>
                                                    <path id="mc-content-unknown-large-b_1_" fill="#F7F9FA" d="M47,30h66c2.209,0,4,1.791,4,4v92c0,2.209-1.791,4-4,4H47
                                                            c-2.209,0-4-1.791-4-4V34C43,31.791,44.791,30,47,30z"></path>
                                                </g>
                                            </g>
                                        </g>
                                        <path fill-rule="evenodd" clip-rule="evenodd" fill="#F15124" d="M102.482,91.479c-0.733-3.055-3.12-4.025-5.954-4.437
                                                c-2.08-0.302-4.735,1.019-6.154-0.883c-2.167-2.905-4.015-6.144-5.428-9.482c-1.017-2.402,1.516-4.188,2.394-6.263
                                                c1.943-4.595,0.738-7.984-3.519-9.021c-2.597-0.632-5.045-0.13-6.849,1.918c-2.266,2.574-1.215,5.258,0.095,7.878
                                                c3.563,7.127-1.046,15.324-8.885,15.826c-3.794,0.243-6.93,1.297-7.183,5.84c0.494,3.255,1.988,5.797,5.14,6.825
                                                c3.062,1,4.941-0.976,6.664-3.186c1.391-1.782,1.572-4.905,4.104-5.291c3.25-0.497,6.677-0.464,9.942-0.025
                                                c2.361,0.318,2.556,3.209,3.774,4.9c2.97,4.122,6.014,5.029,9.126,2.415C101.895,96.694,103.179,94.38,102.482,91.479z
                                                M67.667,94.885c-1.16-0.312-1.621-0.97-1.607-1.861c0.018-1.199,1.032-1.121,1.805-1.132c0.557-0.008,1.486-0.198,1.4,0.827
                                                C69.173,93.804,68.363,94.401,67.667,94.885z M82.146,65.949c1.331,0.02,1.774,0.715,1.234,1.944
                                                c-0.319,0.725-0.457,1.663-1.577,1.651c-1.03-0.498-1.314-1.528-1.409-2.456C80.276,65.923,81.341,65.938,82.146,65.949z
                                                M81.955,86.183c-0.912,0.01-2.209,0.098-1.733-1.421c0.264-0.841,0.955-2.04,1.622-2.162c1.411-0.259,1.409,1.421,2.049,2.186
                                                C84.057,86.456,82.837,86.174,81.955,86.183z M96.229,94.8c-1.14-0.082-1.692-1.111-1.785-2.033
                                                c-0.131-1.296,1.072-0.867,1.753-0.876c0.796-0.011,1.668,0.118,1.588,1.293C97.394,93.857,97.226,94.871,96.229,94.8z"></path>
                                    </svg>
                `;
                break;

            case 'image/jpg':
            case 'image/jpeg':
            case 'image/png':
            case 'image/x-icon':
            case 'image/gif':
                return `
                <svg version="1.1" id="Camada_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="160px" height="160px" viewBox="0 0 160 160" enable-background="new 0 0 160 160" xml:space="preserve">
                <filter height="102%" width="101.4%" id="mc-content-unknown-large-a" filterUnits="objectBoundingBox" y="-.5%" x="-.7%">
                    <feOffset result="shadowOffsetOuter1" in="SourceAlpha" dy="1"></feOffset>
                    <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1">
                    </feColorMatrix>
                </filter>
                <title>Imagem</title>
                <g>
                    <g>
                        <g filter="url(#mc-content-unknown-large-a)">
                            <path id="mc-content-unknown-large-b_2_" d="M47,30h66c2.209,0,4,1.791,4,4v92c0,2.209-1.791,4-4,4H47c-2.209,0-4-1.791-4-4V34
                                    C43,31.791,44.791,30,47,30z"></path>
                        </g>
                        <g>
                            <path id="mc-content-unknown-large-b_1_" fill="#F7F9FA" d="M47,30h66c2.209,0,4,1.791,4,4v92c0,2.209-1.791,4-4,4H47
                                    c-2.209,0-4-1.791-4-4V34C43,31.791,44.791,30,47,30z"></path>
                        </g>
                    </g>
                </g>
                <g>
                    <path fill-rule="evenodd" clip-rule="evenodd" fill="#848484" d="M81.148,62.638c8.086,0,16.173-0.001,24.259,0.001
                            c1.792,0,2.3,0.503,2.301,2.28c0.001,11.414,0.001,22.829,0,34.243c0,1.775-0.53,2.32-2.289,2.32
                            c-16.209,0.003-32.417,0.003-48.626,0c-1.775,0-2.317-0.542-2.318-2.306c-0.002-11.414-0.003-22.829,0-34.243
                            c0-1.769,0.532-2.294,2.306-2.294C64.903,62.637,73.026,62.638,81.148,62.638z M81.115,97.911c7.337,0,14.673-0.016,22.009,0.021
                            c0.856,0.005,1.045-0.238,1.042-1.062c-0.028-9.877-0.03-19.754,0.002-29.63c0.003-0.9-0.257-1.114-1.134-1.112
                            c-14.637,0.027-29.273,0.025-43.91,0.003c-0.801-0.001-1.09,0.141-1.086,1.033c0.036,9.913,0.036,19.826,0,29.738
                            c-0.003,0.878,0.268,1.03,1.069,1.027C66.443,97.898,73.779,97.911,81.115,97.911z"></path>
                    <path fill-rule="evenodd" clip-rule="evenodd" fill="#848484" d="M77.737,85.036c3.505-2.455,7.213-4.083,11.161-5.165
                            c4.144-1.135,8.364-1.504,12.651-1.116c0.64,0.058,0.835,0.257,0.831,0.902c-0.024,5.191-0.024,10.381,0.001,15.572
                            c0.003,0.631-0.206,0.76-0.789,0.756c-3.688-0.024-7.375-0.009-11.062-0.018c-0.33-0.001-0.67,0.106-0.918-0.33
                            c-2.487-4.379-6.362-7.275-10.562-9.819C78.656,85.579,78.257,85.345,77.737,85.036z"></path>
                    <path fill-rule="evenodd" clip-rule="evenodd" fill="#848484" d="M87.313,95.973c-0.538,0-0.815,0-1.094,0
                            c-8.477,0-16.953-0.012-25.43,0.021c-0.794,0.003-1.01-0.176-0.998-0.988c0.051-3.396,0.026-6.795,0.017-10.193
                            c-0.001-0.497-0.042-0.847,0.693-0.839c6.389,0.065,12.483,1.296,18.093,4.476C81.915,90.33,84.829,92.695,87.313,95.973z"></path>
                    <path fill-rule="evenodd" clip-rule="evenodd" fill="#848484" d="M74.188,76.557c0.01,2.266-1.932,4.223-4.221,4.255
                            c-2.309,0.033-4.344-1.984-4.313-4.276c0.03-2.263,2.016-4.213,4.281-4.206C72.207,72.338,74.179,74.298,74.188,76.557z"></path>
                </g>
            </svg>
                `;
                break;

            default:
                return `
                    <svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                        <title>1357054_617b.jpg</title>
                        <defs>
                            <rect id="mc-content-unknown-large-b" x="43" y="30" width="74" height="100" rx="4"></rect>
                            <filter x="-.7%" y="-.5%" width="101.4%" height="102%" filterUnits="objectBoundingBox" id="mc-content-unknown-large-a">
                                <feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
                                <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix>
                            </filter>
                        </defs>
                        <g fill="none" fill-rule="evenodd">
                            <g>
                                <use fill="#000" filter="url(#mc-content-unknown-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-unknown-large-b"></use>
                                <use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-unknown-large-b"></use>
                            </g>
                        </g>
                    </svg>
                `;
                break;
        }

    }

    switchViewFile(file, key) {

        let li = document.createElement('li')

        li.dataset.key = key
        li.dataset.file = JSON.stringify(file)
        li.innerHTML = `
                    ${this.switchViewFileIcon(file)}
                    <div class="name text-center">${file.name}</div>
                    `;

        this.initEventsLi(li)
        return li

    }//Criando "li" para cada item que o firebase tiver salvado

    openFolder() {

        if (this.lastFolder) this.firebaseRef(this.lastFolder).off('value')
        this.initEvents();
        this.renderNav();
        this.readFilesFb();

    }

    renderNav() {

        let nav = document.createElement('nav')
        let path = []

        for (let i = 0; i < this.currentFolder.length; i++) {

            let folderName = this.currentFolder[i];
            let span = document.createElement('span')

            path.push(folderName)

            if ((i + 1) === this.currentFolder.length) {

                span.innerHTML = folderName;

            } else {

                span.className = 'breadcrumb-segment__wrapper';
                span.innerHTML = `<span class="ue-effect-container uee-BreadCrumbSegment-link-0">
                <a href="#" data-path="${path.join('/')}" class="breadcrumb-segment">${folderName}</a>
            </span>
            <svg width="24" height="24" viewBox="0 0 24 24" class="mc-icon-template-stateless" style="top: 4px; position: relative;">
                <title>arrow-right</title>
                <path d="M10.414 7.05l4.95 4.95-4.95 4.95L9 15.534 12.536 12 9 8.464z" fill="#637282" fill-rule="evenodd"></path>
            </svg>`;
            }

            nav.appendChild(span)

        }

        this.navEl.innerHTML = nav.innerHTML

        this.navEl.querySelectorAll('a').forEach(a => {

            a.addEventListener("click", event => {

                event.preventDefault();
                this.currentFolder = a.dataset.path.split('/')
                this.openFolder();

            })

        })

    }

    initEventsLi(li) {


        li.addEventListener('dblclick', event => {

            let file = JSON.parse(li.dataset.file);

            switch (file.type) {
                case 'folder':
                    this.currentFolder.push(file.name);
                    this.openFolder()
                    break;

                default:
                    window.open('/file?path=' + file.path)
                    break;
            }

        })

        li.addEventListener("click", event => {



            if (event.shiftKey) {

                let firstLi = this.listFiles.querySelector('.selected')

                if (firstLi) {

                    let indexStart;
                    let indexEnd;
                    let lis = li.parentElement.childNodes;
                    lis.forEach((element, index) => {

                        if (firstLi === element) indexStart = index
                        if (li === element) indexEnd = index

                    })

                    let index = [indexStart, indexEnd].sort()
                    lis.forEach((el, i) => {

                        if (i >= index[0] && i <= index[1]) el.classList.add('selected')

                    })

                    this.listFiles.dispatchEvent(this.onSelectionChange)
                    return true;

                }
            }

            if (!event.ctrlKey) {

                this.listFiles.querySelectorAll('li.selected').forEach(el => {

                    el.classList.remove('selected')

                })

            }

            li.classList.toggle('selected')

            this.listFiles.dispatchEvent(this.onSelectionChange)

        })

    }//adicionando efeitos nas linhas criadas

    readFilesFb() {

        this.lastFolder = this.currentFolder.join('/')

        this.firebaseRef().on('value', snapshot => {

            this.listFiles.innerHTML = ''

            snapshot.forEach(snapshotItem => {

                let key = snapshotItem.key;
                let data = snapshotItem.val();

                if (data.type) {

                    this.listFiles.appendChild(this.switchViewFile(data, key))

                }
            })

        })

    }//pegando os dados do firebase e atualizando a tela

}