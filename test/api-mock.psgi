#!/usr/bin/perl
use strict;
use warnings;
use utf8;
use JSON;
use Plack::Builder;
use Plack::Request;
use Data::Dumper;
use List::MoreUtils;

my @category_table = generate_categories(5);
my @tag_table = generate_tags(10);
my @entry_table = generate_entries(500);

my $app = sub {
    my $env = shift;
    my $req = Plack::Request->new($env);
    my $items;
    
    if ($req->path_info =~ qr'^/v1/sites/1/entries/(\d+)$') {
        return res_single(entry($req, $1));
    }
    
    if ($req->path_info =~ qr'^/v1/sites/1/entries$') {
        return res_multi(entries($req));
    }
    
    if ($req->path_info =~ qr'^/v1/sites/1/categories$') {
        return res_multi(categories($req));
    }
    
    return res_single(error(404, 'Unknown endpoint'));
};

builder {
    enable 'JSONP';
    enable sub {
        my $app = shift;
        return sub {
            my $env = shift;
            my $res = $app->($env);
            push(@{$res->[1]}, ("Access-Control-Allow-Origin", "*"));
            return $res;
        };
    };
    $app;
};

sub res_error {
    return [
        200,
        [ "Content-Type", "application/json" ],
        [
            encode_json(
                {error => {"code" => $_[0], "message" => $_[1]}}),
        ],
    ];
}

sub res_single {
    my $items = shift;
    return [
        200,
        [ "Content-Type", "application/json" ],
        [
            encode_json($items),
        ],
    ];
}

sub res_multi {
    my $items = shift;
    return [
        200,
        [ "Content-Type", "application/json" ],
        [
            encode_json({
                items => $items,
                totalResults => scalar @$items,
            }),
        ],
    ];
}

sub generate_categories {
    return generate_word_list(shift,
                            ['製品', '研究', 'お知らせ', 'News']);
}

sub generate_tags {
    return generate_word_list(shift,
                            ['MovableType', 'jQuery', 'Perl', 'PHP', '技術全般']);
}

sub generate_word_list {
    my ($size, $words) = @_;
    my %count;
    my @ret;
    
    while (scalar @ret < $size) {
        my $key = $words->[scalar @ret % scalar @$words];
        push(@ret, $key . ($count{$key} || ''));
        $count{$key} = ($count{$key} || 1) + 1;
    }
    return @ret;
}

sub generate_entries {
    my $size = shift;
    my %template = (
        id => 1,
        blog => {
            id => '1'
        },
        author => {
            userpicUrl => undef,
            displayName => 'skr',
        },
        title => '記事',
        body => '<p>ほげほげ</p>',
        excerpt => 'ほげほげ...',
        keywords => '',
        allowTrackbacks => JSON::true,
        trackbacks => [],
        trackbackCount => '0',
        categories => [],
        commentCount => '0',
        tags => [],
        basename => 'article',
        assets => [],
        pingsSentUrl => [],
        class => 'entry',
        more => '',
        status => 'Publish',
        updatable => JSON::false,
        allowComments => JSON::true,
        comments => [],
        permalink => 'http://192.168.56.101/2014/05/article.html',
    );
    
    my @entries;
    
    for my $id (1..$size) {
        my $date = randomDate(86400 * 500);
        my %override = (
            id => $id,
            title => '記事-'. $id,
            modifiedDate => $date,
            createdDate => $date,
            date => $date,
            categories => randomCategory(),
            tags => randomTag(),
        );
        my %unique = (%template, %override);
        
        push(@entries, \%unique);
    }
    
    @entries = sort {$b->{createdDate} cmp $a->{createdDate}} @entries;
    
    return @entries;
}

sub error {
    return {error => {'code' => $_[0], 'message' => $_[1]}};
}

sub entry {
    my ($req, $id) = @_;
    my @ret = grep {$_->{id} == $id} @entry_table;
    return $ret[0] || error(404, 'Entry not found');
}

sub entries {
    my ($req) = @_;
    
    my @filters;
    
    if (my $val = $req->param('from')) {
        push(@filters, sub {
            ($_->{createdDate} =~ qr{(.+)T})[0] gt $val
        });
    }
    
    if (my $val = $req->param('to')) {
        push(@filters, sub {
            ($_->{createdDate} =~ qr{(.+)T})[0] lt $val
        });
    }
    
    if (my $val = $req->param('after')) {
        push(@filters, sub {
            ($_->{createdDate} =~ qr{(.+)T})[0] gt $val
        });
    }
    
    if (my $val = $req->param('category')) {
        utf8::decode($val);
        push(@filters, sub {
            grep {$_ && $_ eq $val} @{$_->{categories}}
        });
    }
    
    if (my $val = $req->param('tag')) {
        utf8::decode($val);
        push(@filters, sub {
            grep {$_ && $_ eq $val} @{$_->{tags}}
        });
    }
    
    my @ret = @entry_table;
    
    @ret = grep {
        my $hit = 1;
        for my $cb (@filters) {
            ($hit = $cb->($_)) || last;
        }
        $hit;
    } @ret;
    
    if (my $val = $req->param('offset')) {
        splice(@ret, 0, $val);
    }
    
    if (my $val = $req->param('limit')) {
        splice(@ret, $val - 1);
    }
    
    if (scalar (my @fields = split(',', $req->param('fields') || ''))) {
        @ret = map {
            my $reduced = {};
            for my $f (@fields) {
                $reduced->{$f} = $_->{$f} if exists $_->{$f};
            }
            $reduced;
        } @ret;
    }
    
    return \@ret;
}

sub randomDate {
    my $scope = shift;
    my ($sec, $min, $hour, $mday, $mon, $year, undef, undef, undef) =
                                            localtime(time - int(rand $scope));
    return sprintf(qq{%04d-%02d-%02dT%02d:%02d:%02d},
                            $year + 1900, $mon + 1, $mday, $hour, $min, $sec);
}

sub randomCategory {
    my @ret;
    for (0 .. int(rand(scalar @category_table))) {
        push(@ret, $category_table[int(rand(scalar @category_table)) - 1]);
    }
    return [List::MoreUtils::uniq @ret];
}

sub randomTag {
    my @ret;
    for (0 .. int(rand(scalar @tag_table))) {
        push(@ret, $tag_table[int(rand(scalar @tag_table)) - 1]);
    }
    return [List::MoreUtils::uniq @ret];
}

sub categories {
    return [map {{
        basename => $_,
        label => $_,
    }} @category_table];
}
