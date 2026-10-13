/*
 * A stand-in for the AirPlay engine, for developing and testing the desktop
 * app without an iPhone. It is a test double: it speaks the same
 * "@@mirlow <event>" protocol on stdout as the patched UxPlay, opens a real
 * Direct3D 11 video window showing a test pattern, and exits when its stdin
 * closes. It is never bundled with the app, and debug builds only use it when
 * MIRLOW_DEV_ENGINE_EXE points at it (see docs/DEVELOPMENT.md).
 *
 * Timeline: ready, a device connects, a portrait picture, a rotation to
 * landscape, back to portrait, then the device disconnects. Then it repeats.
 */
#include <gst/gst.h>
#include <stdio.h>
#include <string.h>

static GMainLoop *loop;
static GstElement *pipeline;
static int step;

static void say(const char *line) {
    printf("@@mirlow %s\n", line);
    fflush(stdout);
}

static void show(int width, int height) {
    char launch[256];
    char event[64];
    if (pipeline) {
        gst_element_set_state(pipeline, GST_STATE_NULL);
        gst_object_unref(pipeline);
    }
    snprintf(launch, sizeof(launch),
             "d3d11testsrc pattern=smpte ! video/x-raw(memory:D3D11Memory),width=%d,height=%d,framerate=30/1 "
             "! d3d11videosink fullscreen-toggle-mode=none",
             width, height);
    pipeline = gst_parse_launch(launch, NULL);
    gst_element_set_state(pipeline, GST_STATE_PLAYING);
    snprintf(event, sizeof(event), "video-size %d %d %d %d", width, height, width, height);
    say("video-codec h264");
    say(event);
}

static gboolean advance(gpointer data) {
    switch (step++ % 6) {
    case 0:
        say("client iPhone16,1\tTest iPhone");
        say("connections 1");
        break;
    case 1:
        show(590, 1280);
        break;
    case 2:
        show(1280, 590);
        break;
    case 3:
        show(590, 1280);
        break;
    case 4:
        say("video-reset 3");
        if (pipeline) {
            gst_element_set_state(pipeline, GST_STATE_NULL);
            gst_object_unref(pipeline);
            pipeline = NULL;
        }
        say("connections 0");
        break;
    default:
        break;
    }
    return G_SOURCE_CONTINUE;
}

static gpointer watch_stdin(gpointer data) {
    char buffer[64];
    while (fgets(buffer, sizeof(buffer), stdin)) {
        if (strncmp(buffer, "quit", 4) == 0) break;
    }
    g_main_loop_quit(loop);
    return NULL;
}

int main(int argc, char **argv) {
    int seconds = 6;
    gst_init(&argc, &argv);
    for (int i = 1; i < argc - 1; i++) {
        if (strcmp(argv[i], "--step-seconds") == 0) seconds = atoi(argv[i + 1]);
    }
    loop = g_main_loop_new(NULL, FALSE);
    g_thread_unref(g_thread_new("stdin", watch_stdin, NULL));
    say("ready Fake engine");
    g_timeout_add_seconds(seconds > 0 ? seconds : 6, advance, NULL);
    g_main_loop_run(loop);
    if (pipeline) gst_element_set_state(pipeline, GST_STATE_NULL);
    return 0;
}
