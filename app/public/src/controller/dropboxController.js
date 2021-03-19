class DropBoxController {

    constructor() {

        this.btnSendFile = document.querySelector('#btn-send-file')
        this.inputFiles = document.querySelector('#files')

        this.snackBar = document.querySelector('#react-snackbar-root')
        this.progressBar = this.snackBar.querySelector('.mc-progress-bar-fg')
        this.nameFileBar = this.snackBar.querySelector('.filename')
        this.timeFileBar = this.snackBar.querySelector('.timeleft')

        this.initEvents();

    }

    initEvents() {

        this.btnSendFile.addEventListener('click', (e) => {

            this.inputFiles.click();

        });

        this.inputFiles.addEventListener('change', (e) => {

            this.uploadTask(e.target.files);
            this.modalShow();
            this.inputFiles.value = '';

        })
    }

    modalShow(show = true) {

        this.snackBar.style.display = (show) ? 'block' : 'none';

    }

    uploadTask(files) {

        let promises = [];

        [...files].forEach(file => {
            promises.push(new Promise((resolve, reject) => {
                let ajax = new XMLHttpRequest();
                ajax.open('POST', '/upload');
                ajax.onload = event => {

                    setTimeout(() => {
                        this.modalShow(false)
                    }, 2000)


                    try {
                        resolve(JSON.parse(ajax.responseText));
                    } catch (e) {
                        reject(e);
                    }

                }

                ajax.onerror = event => {

                    setTimeout(() => {
                        this.modalShow(false)
                    }, 2000)
                    reject(event);

                }

                ajax.upload.onprogress = event => {

                    this.uploadProgress(event, file);

                }


                let formData = new FormData();

                formData.append('input-file', file);
                this.startUploadTime = Date.now();
                ajax.send(formData);

            }))
        })

        return Promise.all(promises)

    }

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

    }

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

}