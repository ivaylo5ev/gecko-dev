# -*- coding: utf-8 -*-

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from __future__ import absolute_import, print_function, unicode_literals
from taskgraph import try_option_syntax

INTEGRATION_PROJECTS = set([
    'mozilla-inbound',
    'autoland',
])

RELEASE_PROJECTS = set([
    'mozilla-central',
    'mozilla-aurora',
    'mozilla-beta',
    'mozilla-release',
])

_target_task_methods = {}


def _target_task(name):
    def wrap(func):
        _target_task_methods[name] = func
        return func
    return wrap


def get_method(method):
    """Get a target_task_method to pass to a TaskGraphGenerator."""
    return _target_task_methods[method]


@_target_task('from_parameters')
def target_tasks_from_parameters(full_task_graph, parameters):
    """Get the target task set from parameters['target_tasks'].  This is
    useful for re-running a decision task with the same target set as in an
    earlier run, by copying `target_tasks.json` into `parameters.yml`."""
    return parameters['target_tasks']


@_target_task('try_option_syntax')
def target_tasks_try_option_syntax(full_task_graph, parameters):
    """Generate a list of target tasks based on try syntax in
    parameters['message'] and, for context, the full task graph."""
    options = try_option_syntax.TryOptionSyntax(parameters['message'], full_task_graph)
    target_tasks_labels = [t.label for t in full_task_graph.tasks.itervalues()
                           if options.task_matches(t.attributes)]

    # If the developer wants test jobs to be rebuilt N times we add that value here
    if int(options.trigger_tests) > 1:
        for l in target_tasks_labels:
            task = full_task_graph[l]
            if 'unittest_suite' in task.attributes:
                task.attributes['task_duplicates'] = options.trigger_tests

    return target_tasks_labels


@_target_task('default')
def target_tasks_default(full_task_graph, parameters):
    """Target the tasks which have indicated they should be run on this project
    via the `run_on_projects` attributes."""
    def filter(task):
        run_on_projects = set(t.attributes.get('run_on_projects', []))
        if 'all' in run_on_projects:
            return True
        project = parameters['project']
        if 'integration' in run_on_projects:
            if project in INTEGRATION_PROJECTS:
                return True
        if 'release' in run_on_projects:
            if project in RELEASE_PROJECTS:
                return True
        return project in run_on_projects
    return [l for l, t in full_task_graph.tasks.iteritems() if filter(t)]


@_target_task('ash_tasks')
def target_tasks_ash(full_task_graph, parameters):
    """Target tasks that only run on the ash branch."""
    def filter(task):
        platform = task.attributes.get('build_platform')
        # only select platforms
        if platform not in ('linux64', 'linux64-asan', 'linux64-pgo'):
            return False
        # and none of this linux64-asan/debug stuff
        if platform == 'linux64-asan' and task.attributes['build_type'] == 'debug':
            return False
        # no non-et10s tests
        if task.attributes.get('unittest_suite') or task.attributes.get('talos_siute'):
            if not task.attributes.get('e10s'):
                return False
        # don't upload symbols
        if task.attributes['kind'] == 'upload-symbols':
            return False
        return True
    return [l for l, t in full_task_graph.tasks.iteritems() if filter(t)]


@_target_task('nightly_fennec')
def target_tasks_nightly(full_task_graph, parameters):
    """Select the set of tasks required for a nightly build of fennec. The
    nightly build process involves a pipeline of builds, signing,
    and, eventually, uploading the tasks to balrog."""
    def filter(task):
        return task.attributes.get('nightly', False)
    return [l for l, t in full_task_graph.tasks.iteritems() if filter(t)]
