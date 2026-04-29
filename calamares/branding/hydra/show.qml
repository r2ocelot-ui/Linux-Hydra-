/* Calamares slideshow — Hydra OS */
import QtQuick 2.0
import calamares.slideshow 1.0

Presentation {
    id: presentation

    function next() {
        presentation.goToNextSlide()
    }

    Timer {
        id: slideTimer
        interval: 5000
        running: true
        repeat: true
        onTriggered: presentation.next()
    }

    Slide {
        anchors.fill: parent

        Rectangle {
            anchors.fill: parent
            color: "#1a1e23"
        }

        Column {
            anchors.centerIn: parent
            spacing: 20

            Text {
                text: "Bienvenido a Hydra OS"
                color: "#eff0f1"
                font.pixelSize: 32
                font.bold: true
                horizontalAlignment: Text.AlignHCenter
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "Un sistema moderno, rápido y familiar"
                color: "#3daee9"
                font.pixelSize: 18
                horizontalAlignment: Text.AlignHCenter
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "Estamos instalando Hydra OS en tu equipo.\nEsto tardará unos minutos."
                color: "#bdc3c7"
                font.pixelSize: 14
                horizontalAlignment: Text.AlignHCenter
                anchors.horizontalCenter: parent.horizontalCenter
            }
        }
    }

    Slide {
        anchors.fill: parent

        Rectangle {
            anchors.fill: parent
            color: "#1a1e23"
        }

        Column {
            anchors.centerIn: parent
            spacing: 20

            Text {
                text: "Escritorio KDE Plasma"
                color: "#eff0f1"
                font.pixelSize: 32
                font.bold: true
                horizontalAlignment: Text.AlignHCenter
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "Interfaz familiar, potente y personalizable.\nSimilar a Windows, pero libre."
                color: "#bdc3c7"
                font.pixelSize: 14
                horizontalAlignment: Text.AlignHCenter
                anchors.horizontalCenter: parent.horizontalCenter
            }
        }
    }

    Slide {
        anchors.fill: parent

        Rectangle {
            anchors.fill: parent
            color: "#1a1e23"
        }

        Column {
            anchors.centerIn: parent
            spacing: 20

            Text {
                text: "Gaming con Steam y Lutris"
                color: "#eff0f1"
                font.pixelSize: 32
                font.bold: true
                horizontalAlignment: Text.AlignHCenter
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "Juega juegos de Windows con Proton.\nMangoHud para monitorizar el rendimiento."
                color: "#bdc3c7"
                font.pixelSize: 14
                horizontalAlignment: Text.AlignHCenter
                anchors.horizontalCenter: parent.horizontalCenter
            }
        }
    }

    Slide {
        anchors.fill: parent

        Rectangle {
            anchors.fill: parent
            color: "#1a1e23"
        }

        Column {
            anchors.centerIn: parent
            spacing: 20

            Text {
                text: "Apps incluidas"
                color: "#eff0f1"
                font.pixelSize: 32
                font.bold: true
                horizontalAlignment: Text.AlignHCenter
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "Firefox · LibreOffice · VLC · GIMP\nThunderbird · Timeshift · KeePassXC"
                color: "#bdc3c7"
                font.pixelSize: 14
                horizontalAlignment: Text.AlignHCenter
                anchors.horizontalCenter: parent.horizontalCenter
            }
        }
    }
}
